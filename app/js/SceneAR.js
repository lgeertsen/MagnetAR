'use strict';

import React, { Component } from 'react';

import {StyleSheet} from 'react-native';

import {
  ViroARScene,
  ViroText,
  ViroConstants,
  ViroNode,
  ViroBox,
  ViroMaterials,
  ViroAnimations,
  ViroSkyBox,
  ViroPortalScene,
  ViroPortal,
  Viro3DObject,
  Viro360Image,
  ViroAmbientLight
} from 'react-viro';

export default class SceneAR extends Component {
  constructor() {
    super();

    this.state = {

    };
  }

  render() {
    return (
      <ViroARScene onTrackingUpdated={(state, reason) => this.props.arSceneNavigator.viroAppProps.onTrackingUpdated(state, reason)} onCameraTransformUpdate={(obj) => this.props.arSceneNavigator.viroAppProps.updateCamera(obj.cameraTransform)}>
      </ViroARScene>
    );
  }
}

module.exports = SceneAR;
