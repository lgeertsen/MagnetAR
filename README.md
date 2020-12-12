# Magnet AR
A mobile application that allows you to animate cameras directly inside 3D software

## Requirements
First you have to install some tools

##### Install git
https://git-scm.com/downloads

##### Install NodeJs
https://nodejs.org/en/download/

##### Install yarn
Do this after you installed NodeJs
Open a terminal and run the following command
```bash
$ npm install -g yarn
```

##### Install Viro Media
Now on your phone install the app `Viro Media`
If you are on Android also install `Google Play-services for AR`
Or on IOS install `AR Kit`

## Clone the repository
In a terminal run the following command to clone Magnet AR
```bash
$ git clone https://github.com/lgeertsen/MagnetAR.git
```

## Setup Maya
Add the Magnet AR dcc folder to your Maya plugin path
To do this edit your Maya.env and add the following line
```
MAYA_PLUG_IN_PATH = $MAYA_PLUG_IN_PATH;{Path_to_Magnet_AR}/MagnetAR/dcc
```
Replace `{Path_to_Magnet_AR}` with the path to the MagnetAR directory

## Setup Magnet AR for the first time
Open a command line and run the following
```bash
$ cd MagnetAR
$ cd main
$ yarn install
```

On another terminal
```bash
$ cd MagnetAR
$ cd app
$ yarn install
```

replace the following files content:
`{Path_to_Magnet_AR}/MagnetAR/app/node_modules/metro_config/src/defaults/blacklist.js`
with this the contents of this file:
https://github.com/facebook/metro/blob/7c6f30b592b2fb23cee55b54f1aa4b7a522dec18/packages/metro-config/src/defaults/blacklist.js

## Run MagnetAR
In terminal that is in the main folder run
```bash
$ yarn start
```

This will launch the site and the overlay window
Click start stream on the webpage & select the `MagnetAR Capture` window
You can resize and move the capture window. Put the window on top off your Maya viewport

Inside Maya launch the MagnetAR plugin. Once it's started you can see on the Magnet AR webpage that Maya is connected

In terminal that is in the app folder run
```bash
$ yarn start
```
Now to connect the phone launch the Viro Media app and connect to the application by putting in the IP address shown on the Magnet AR webpage.

**!!! Important: Make sure that the computer and phone are on the same wifi !!!**
