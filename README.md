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

## Run MagnetAR
In terminal that is in the main folder run
```bash
$ yarn start
```

This will launch the site and the overlay window

In terminal that is in the app folder run
```bash
$ yarn start
```
