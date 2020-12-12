import sys
import os
import maya.api.OpenMaya as OpenMaya
import maya.cmds as cmds
import MagnetAR

##########################################################
# Plug-in
##########################################################
class MagnetARMayaPlugin( OpenMaya.MPxCommand ):
    kPluginCmdName = 'magnetAR'

    def __init__(self):
        ''' Constructor. '''
        OpenMaya.MPxCommand.__init__(self)

    @staticmethod
    def cmdCreator():
        ''' Create an instance of our command. '''
        return MagnetARMayaPlugin()

    def doIt(self, args):
        ''' Command execution. '''
        import MagnetAR
        magnetAR = reload(MagnetAR.MagnetAR_Maya)
        magnetAR.MagnetAR()

##########################################################
# Plug-in initialization.
##########################################################
def maya_useNewAPI():
	"""
	The presence of this function tells Maya that the plugin produces, and
	expects to be passed, objects created using the Maya Python API 2.0.
	"""
	pass

def configPlugin():
    pluginPath = os.path.dirname(os.path.abspath(MagnetAR.__file__))
    shelfName = 'MagnetAR'
    buttonName = 'MagnetAR'
    iconName = 'magnetAR_32x32.png'
    iconPath = os.path.join(pluginPath, iconName)
    buttonExists = False
    if not cmds.shelfLayout(shelfName, ex=True):
        cmds.shelfLayout(shelfName, p='ShelfLayout')
    else:
        buttons = cmds.shelfLayout(shelfName, q=True, ca=True)
        if buttons:
            for button in buttons:
                if cmds.shelfButton(button, q=True, l=True) == buttonName:
                    buttonExists = True
                    break
    if not buttonExists:
        print("create button")
        cmds.shelfButton(w=35, h=35, i=iconPath, l=buttonName, c='from maya import cmds; cmds.'+MagnetARMayaPlugin.kPluginCmdName+'()', p=shelfName)

def initializePlugin( mobject ):
    ''' Initialize the plug-in when Maya loads it. '''
    configPlugin()
    mplugin = OpenMaya.MFnPlugin( mobject )
    try:
        mplugin.registerCommand( MagnetARMayaPlugin.kPluginCmdName, MagnetARMayaPlugin.cmdCreator )
    except:
        sys.stderr.write( 'Failed to register command: ' + MagnetARMayaPlugin.kPluginCmdName )

def uninitializePlugin( mobject ):
    ''' Uninitialize the plug-in when Maya un-loads it. '''
    mplugin = OpenMaya.MFnPlugin( mobject )
    try:
        mplugin.deregisterCommand( MagnetARMayaPlugin.kPluginCmdName )
    except:
        sys.stderr.write( 'Failed to unregister command: ' + MagnetARMayaPlugin.kPluginCmdName )
