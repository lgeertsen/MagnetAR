import os
import sys
import json
import logging
import timeit
import time

import maya.cmds as cmds
import maya.utils as utils

parent_dir = os.path.abspath(os.path.dirname(__file__))
vendor_dir = os.path.join(parent_dir, 'vendor')
if vendor_dir not in sys.path:
    sys.path.append(vendor_dir)

import socketio

def maya_useNewAPI():
    """
    The presence of this function tells Maya that the plugin produces, and
    expects to be passed, objects created using the Maya Python API 2.0.
    """
    pass


logger = logging.getLogger(__name__)
logger.setLevel(logging.WARNING)

class MayaSocket(socketio.ClientNamespace):
    def __init__(self, namespace, magnetAR):
        super(MayaSocket, self).__init__(namespace)
        self._magnetAR = magnetAR

    def on_connect(self):
        print("connected to maya namespace")
        self._magnetAR._connected = True
        scene_name = self._magnetAR._scene
        if not scene_name:
            scene_name = "scene"
        cameras = self._magnetAR._cameras

        self._magnetAR._sio.emit("software", {
            "soft": "maya",
            "scene": scene_name,
            "cameras": cameras,
            "start": self._magnetAR._startFrame,
            "end": self._magnetAR._endFrame,
            "frame": self._magnetAR._frame
        })

    def on_disconnect(self):
        print("disconnected")
        self._magnetAR._connected = False

    def on_selectCamera(self, data):
        self._magnetAR._init_position = None
        self._magnetAR._camera = data
        self._magnetAR.execute(self._magnetAR.get_camera_initial_data)

    def on_transform(self, data):
        pos = self._magnetAR._init_position
        mult = self._magnetAR._movementMultiplier
        if not pos == None:
            position = [(float(data["position"][0])*mult) + pos[0], (float(data["position"][1])*mult) + pos[1], (float(data["position"][2])*mult) + pos[2]]
            self._magnetAR.execute(self._magnetAR.do_set_camera_transform, position, data["rotation"])

    def on_setFocalLength(self, data):
        self._magnetAR.execute(self._magnetAR.set_focal_length, float(data))

    def on_setMovementMultiplier(self, data):
        self._magnetAR._movementMultiplier = float(data)

    def on_playback(self, data):
        if data["play"]:
            cmds.play(forward=True)
        else:
            frame = int(data["frame"])
            cmds.play(state=False)
            cmds.currentTime(frame, edit=True)

    def on_goToStart(self):
        cmds.currentTime(self._magnetAR._startFrame, edit=True)

    def on_goToEnd(self):
        cmds.currentTime(self._magnetAR._endFrame, edit=True)

    def on_setFrame(self, frame):
        cmds.currentTime(frame, edit=True)

    def on_keyframes(self, data):
        self._magnetAR.execute(self._magnetAR.set_keyframes, data)


class MagnetAR():
    def __init__(self):
        self._movementMultiplier = 1
        self._startFrame = cmds.playbackOptions(query=True, minTime=True)
        self._endFrame = cmds.playbackOptions(query=True, maxTime=True)
        self._frame = cmds.currentTime(query=True)
        self._cameras = self.get_cameras()
        if len(self._cameras):
            print('camera: ' + self._cameras[0])
            self._camera = self._cameras[0]
        else:
            self._camera = None
        self._init_position = None
        self.get_camera_initial_data()
        print("self._cameras", self._cameras)
        self._sio = socketio.Client(logger=logger, engineio_logger=logger)
        self._sio.register_namespace(MayaSocket('/', self))
        self._connected = False
        self.createUI()

    def createUI(self):
        self._window = cmds.window( title="MagnetAR", iconName='Short Name', sizeable=False )
        self._scene = self.execute(self.getSceneName)
        cmds.columnLayout( adjustableColumn=True )

        cmds.button( label='Launch MagnetAR', command=self.launch )
        cmds.button( label='Stop MagnetAR', command=self.stop )
        cmds.button( label='Close', command=self.closeUI )

        cmds.setParent( '..' )

        cmds.showWindow( self._window )

    def getSceneName(self):
        filepath = cmds.file(q=True, sn=True)
        filename = os.path.basename(filepath)
        raw_name, extension = os.path.splitext(filename)
        if(raw_name == ""):
            raw_name = "untitled"
        return raw_name

    def launch(self, *args):
        if not self._connected:
            self._sio.connect('http://localhost:8082')

    def stop(self, *args):
        if self._connected:
            self._sio.emit("close-software")

    def closeUI(self, *args):
        if self._connected:
            self._sio.emit("close-software")
        cmds.deleteUI( self._window, window=True)

    def do_create_new_camera(self, id):
        success = True
        try:
            camera = cmds.camera()
            self._cameras[id] = camera
        except:
            success = False
        return success

    def do_set_camera_transform(self, translation, rotation):
        cmds.xform(self._camera, translation=translation, rotation=rotation)
        return True

    def get_cameras(self):
        cameras = cmds.ls(type='camera', long=True)
        startup_cameras = [camera for camera in cameras if cmds.camera(cmds.listRelatives(camera, parent=True)[0], startupCamera=True, q=True)]
        non_startup_cameras = list(set(cameras) - set(startup_cameras))
        non_startup_cameras_transforms = map(lambda x: cmds.listRelatives(x, parent=True)[0], non_startup_cameras)
        return non_startup_cameras_transforms

    def get_camera_initial_data(self):
        position = cmds.xform(self._camera, q=True, ws=True, translation=True)
        self._init_position = position

    def set_focal_length(self, focal):
        cmds.setAttr('{camera}.focalLength'.format(camera=self._camera), focal)

    def set_keyframes(self, keyframes):
        pos = self._init_position
        for i in range(len(keyframes)):
            keyframe = keyframes[i]
            keyPos = keyframe["position"]
            rotation = keyframe["rotation"]
            position = [(float(keyPos[0])*1) + pos[0], (float(keyPos[1])*1) + pos[1], (float(keyPos[2])*1) + pos[2]]
            cmds.xform(self._camera, translation=position, rotation=rotation)
            cmds.setKeyframe(self._camera, attribute=['t','r'], t=i)
        # cmds.selectKey([self._camera+'_translateX', self._camera+'_translateY', self._camera+'_translateZ', self._camera+'_rotateX', self._camera+'_rotateY', self._camera+'_rotateZ'], k=True)
        # cmds.filterCurve(f="butterworth", cof=30, sr=6, kof=True, s=0)
        # anim_curves = cmds.listConnections((self._camera+'.rotateX', self._camera+'.rotateY', self._camera+'.rotateZ'), type='animCurve', skipConversionNodes=True)
        # cmds.filterCurve(anim_curves)


    def execute(self, func, *args):
        utils.executeInMainThreadWithResult(func, *args)
