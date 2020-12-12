import React, { Component } from 'react';
import {
  AppRegistry,
  Image,
  Modal,
  PixelRatio,
  Slider,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  View,
  WebView
} from 'react-native';

// import { WebView } from 'react-native-webview';

// const io = require('socket.io-client');
import io from 'socket.io-client'

var socket;

import {
  ViroConstants,
  ViroARSceneNavigator
} from 'react-viro';

var SceneAR = require('./js/SceneAR');


export default class App extends Component {
  constructor() {
    super();

    this.onTrackingUpdated = this.onTrackingUpdated.bind(this);
    this.updateCamera = this.updateCamera.bind(this);

    this.recordInterval = undefined;

    this.state = {
      connected: false,
      ipaddress: '',
      isConnected: false,
      hasARInitialized: false,
      position : [0, 0, 0],
      rotation: [0, 0, 0],
      canSendTransform: false,
      cameras: [],
      camera: "",
      cameraModal: false,
      focalLength: 35,
      movementMultiplier: 1,
      recording: false,
      sendTransform: false,
      keyframes: [],
      playback: false,
      frame: 1,
      startFrame: 1,
      endFrame: 10
    }
  }

  connect() {
    this.setState({connected: true})
    socket = io(`http://${this.state.ipaddress}:8082`, {});

    socket.on('connect', () => {
      this.setState({ isConnected: true });
      // this.setState({ canSendTransform: true });
      socket.emit("phone");
    });

    socket.on('software', data => {
      if(data.cameras.length) {
        this.setState({canSendTransform: true, cameras: data.cameras, camera: data.cameras[0]})
      }
      this.setState({startFrame: data.start, endFrame: data.end, frame: data.frame})
    })

    setInterval(() => {
      if(this.state.sendTransform && this.state.hasARInitialized && this.state.canSendTransform) {
        socket.emit('transform', {position: this.state.position, rotation: this.state.rotation})
      }
    }, 1000/25)
  }

  selectCamera(cam) {
    this.setState({camera: cam, cameraModal: false})
    socket.emit('selectCamera', cam)
  }

  setFocalLength(value) {
    this.setState({focalLength: value.toFixed(2)})
    socket.emit("setFocalLength", value.toFixed(2))
  }

  setMovementMultiplier(value) {
    this.setState({movementMultiplier: value.toFixed(2)})
    socket.emit("setMovementMultiplier", value.toFixed(2))
  }

  setSendTransform() {
    let send = this.state.sendTransform
    this.setState({sendTransform: !send})
  }

  goToStart() {
    this.setState({frame: this.state.startFrame})
    socket.emit("goToStart")
  }

  gotToEnd() {
    this.setState({frame: this.state.endFrame})
    socket.emit("goToEnd")
  }

  stepBackward() {
    let frame = this.state.frame;
    frame -= 1;
    if(frame >= this.state.startFrame) {
      socket.emit('setFrame', frame)
    }
  }

  stepForward() {
    let frame = this.state.frame;
    frame += 1;
    if(frame <= this.state.endFrame) {
      socket.emit('setFrame', frame)
    }
  }

  recordToggle() {
    let record = this.state.recording
    if(record) {
      this.setState({recording: false});
      clearInterval(this.recordInterval);
      socket.emit("keyframes", this.state.keyframes);
      this.setState({recording: !record})
    } else {
      this.setState({recording: true, keyframes: []});
      this.recordInterval = setInterval(this.sendKeyframes, 1000/24, this);
      this.setState({recording: !record})
    }
  }

  sendKeyframes(self) {
    let keyframes = self.state.keyframes;
    let mult = self.state.movementMultiplier
    let pos = self.state.position
    pos[0] *= mult
    pos[1] *= mult
    pos[2] *= mult
    let keyframe = {
      position: pos,
      rotation: self.state.rotation
    };
    keyframes.push(keyframe);
    self.setState({keyframes: keyframes});
  }

  onTrackingUpdated(state, reason) {
    if (!this.state.hasARInitialized && state == ViroConstants.TRACKING_NORMAL) {
      this.setState({
        hasARInitialized : true
      });
    }
  }

  playback() {
    let play = this.state.playback
    this.setState({playback: !play})
    socket.emit('playback', {play: !play, frame: this.state.frame})
  }

  updateCamera(transform) {
    let position = this.toFixed(transform.position, 4)
    let rotation = this.toFixed(transform.rotation, 4)
    this.setState({position: position, rotation: rotation})
  }

  toFixed(array, n) {
    for(let i = 0; i < array.length; i++) {
      array[i] = array[i].toFixed(n)
    }
    return array
  }

  render() {
    if(!this.state.connected) {
      return this.renderIpInput()
      // return this.renderWebView()
    } else {
      return this.renderWebView()
    }
  }

  renderIpInput() {
    return(
      <View style={localStyles.ipView}>
        <Text style={{color: "#fff"}}>Enter IP Address:</Text>
        <TextInput
          style={localStyles.ipInput}
          onChangeText={text => this.setState({ipaddress: text})}
          value={this.state.ipaddress}
        />
        <TouchableHighlight
          style={localStyles.button}
          onPress={() => this.connect()}
        >
          <Text style={{color: "#fff"}}>Connect</Text>
        </TouchableHighlight>
      </View>
    )
  }

  renderCameraPicker() {
    let cams = this.state.cameras
    if(cams.length) {
      let btns = []

      for(let i = 0; i < cams.length; i++) {
        let cam = cams[i]
        btns.push(
          <TouchableHighlight
            key={i}
            style={this.state.cam == cam ? localStyles.cameraSelected : localStyles.cameraBtn}
            onPress={() => this.selectCamera(cam)}
          >
            <Text style={{color: "#fff"}}>{cam}</Text>
          </TouchableHighlight>
        )
      }

      return (
        <Modal
          animationType="slide"
          transparent={false}
          visible={this.state.cameraModal}
        >
          <View
            style={localStyles.cameraModalView}
          >
            {btns}
          </View>
        </Modal>
      )
    }
    return null
  }

  renderWebView() {
    return(
      <View style={localStyles.webContainer}>
      {/* <View styles={localStyles.ARNavigator}> */}
        <ViroARSceneNavigator
          viroAppProps={{onTrackingUpdated: this.onTrackingUpdated, updateCamera: this.updateCamera, hasARInitialized: this.state.hasARInitialized}}
          initialScene={{scene: SceneAR}}
        />
      {/* </View> */}
      <View style={localStyles.uiContainer}>
        <View style={{
          flex: 1,
          flexDirection: 'row'
        }}>
          <View style={{
            flexDirection: "row",
            width: 150
          }}>
            <View style={{flexDirection: "column", alignItems: "center", justifyContent: "center"}}>
              <Text style={{color: "#fff", textAlign: "center"}}>Multiplier</Text>
              <Text style={{color: "#fff", textAlign: "center", fontWeight: "bold"}}>{this.state.movementMultiplier}</Text>
              <Slider
                style={{
                  flex: 1,
                  width: 250,
                  transform: [{ rotate: "-90deg" }]
                }}
                minimumValue={1}
                maximumValue={50}
                minimumTrackTintColor="#eb3b5a"
                maximumTrackTintColor="#fff"
                thumbTintColor="#eb3b5a"
                value={parseFloat(this.state.movementMultiplier)}
                onValueChange={(value) => this.setMovementMultiplier(value)}
              />
            </View>
          </View>
          <View style={{
            flex: 1,
            backgroundColor: "#222",
            // alignItems: "center",
            // justifyContent: "center"
          }}>
            <TouchableHighlight
              onPress={() => this.setState({cameraModal: true})}
              style={{
                alignSelf: 'center',
                justifySelf: 'center',
                backgroundColor: "#eb3b5a",
                padding: 10,
                marginBottom: 10
              }}
            >
              <Text style={{color: "#fff"}}>{this.state.camera}</Text>
            </TouchableHighlight>
            <WebView
              style={localStyles.webView}
              source={{
                uri: `http://${this.state.ipaddress}:8082/watch`
              }}
            />
          </View>
          <View style={{
            flexDirection: "row",
            width: 150,
          }}>
            <View style={{flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "center"}}>
              <Text style={{color: "#fff", textAlign: "center"}}>Focal</Text>
              <Text style={{color: "#fff", textAlign: "center", fontWeight: "bold"}}>{this.state.focalLength}</Text>
              <Slider
                style={{
                  flex: 1,
                  width: 250,
                  transform: [{ rotate: "-90deg" }]
                }}
                minimumValue={0}
                maximumValue={70}
                minimumTrackTintColor="#eb3b5a"
                maximumTrackTintColor="#fff"
                thumbTintColor="#eb3b5a"
                value={parseFloat(this.state.focalLength)}
                onValueChange={(value) => this.setFocalLength(value)}
              />
            </View>
            <View style={{flex: 1, flexDirection: "column", justifyContent: "center", paddingRight: 20}}>
              <TouchableHighlight style={localStyles.roundBtn} onPress={() => this.setSendTransform()}>
                {this.state.sendTransform ?
                  <Image source={require('./assets/video-slash-solid.png')}/>
                  :
                  <Image source={require('./assets/video-solid.png')}/>
                }
              </TouchableHighlight>
              <TouchableHighlight style={localStyles.roundBtn} onPress={() => this.recordToggle()}>
                {this.state.recording ?
                  <Image source={require('./assets/stop-solid.png')}/>
                  :
                  <View style={{height: 32, width: 32, borderRadius: 16, backgroundColor: "#eb3b5a"}}></View>
                }
              </TouchableHighlight>
              <TouchableHighlight style={localStyles.roundBtn} onPress={() => this.playback()}>
                {this.state.playback ?
                  <Image source={require('./assets/pause-solid.png')}/>
                  :
                  <Image source={require('./assets/play-solid.png')}/>
                }
              </TouchableHighlight>
            </View>
          </View>
        </View>
        <View style={{
          flexDirection: "row",
          justifyContent: "center",
          height: 70
        }}>
        <TouchableHighlight style={localStyles.roundBtn} onPress={() => this.goToStart()}>
          <Image source={require('./assets/fast-backward-solid.png')}/>
        </TouchableHighlight>
        <TouchableHighlight style={localStyles.roundBtn} onPress={() => this.stepBackward()}>
          <Image source={require('./assets/step-backward-solid.png')}/>
        </TouchableHighlight>
        <TouchableHighlight style={localStyles.roundBtn} onPress={() => this.stepForward()}>
          <Image source={require('./assets/step-forward-solid.png')}/>
        </TouchableHighlight>
        <TouchableHighlight style={localStyles.roundBtn} onPress={() => this.gotToEnd()}>
          <Image source={require('./assets/fast-forward-solid.png')}/>
        </TouchableHighlight>
        </View>
      </View>
      {this.renderCameraPicker()}
    </View>
    )
  }
}

var localStyles = StyleSheet.create({
  ipView: {
    flex : 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "pink",
  },
  ipInput: {
    height: 40,
    width: '80%',
    borderColor: '#fff',
    borderWidth: 1,
    color: "#aaa"
  },
  webContainer: {
    flex: 1
  },
  webView: {
    flex: 1,
  },
  uiContainer: {
    flexDirection: 'column',
    width: "100%",
    height: "100%",
    position:'absolute',
    padding: 15,
    paddingTop: 22,
    backgroundColor: "#222"
  },
  ARNavigator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 50,
    height: 50,
    display: 'none'
  },
  cameraModalView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22
  },
  cameraBtn: {
    backgroundColor: "#444",
    padding: 10
  },
  cameraSelected: {
    backgroundColor: "#eb3b5a",
    padding: 10
  },
  outer: {
    flex : 1,
    flexDirection: 'row',
    alignItems:'center',
    backgroundColor: "black",
  },
  inner: {
    flex : 1,
    flexDirection: 'column',
    alignItems:'center',
    backgroundColor: "black",
  },
  titleText: {
    paddingTop: 30,
    paddingBottom: 20,
    color:'#fff',
    textAlign:'center',
    fontSize : 25
  },
  buttonText: {
    color:'#fff',
    textAlign:'center',
    fontSize : 20
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    width: 150,
    paddingTop:20,
    paddingBottom:20,
    marginTop: 10,
    marginBottom: 10,
    backgroundColor:'#eb3b5a',
  },
  roundBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    width: 50,
    margin: 10,
    backgroundColor: "#eee",
    borderRadius: 25
  }
});

module.exports = App
