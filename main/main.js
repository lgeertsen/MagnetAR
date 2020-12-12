// Modules to control application life and create native browser window
const {app, BrowserWindow, shell} = require('electron')
const path = require('path')
const { networkInterfaces } = require('os');

var express = require('express')
var expressApp = express();
var http = require('http').createServer(expressApp);
var io = require('socket.io')(http);

expressApp.use(express.static('public'))

var broadcaster = undefined
var software = undefined
var phone = undefined

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 400,
    height: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true
    // webPreferences: {
    //   preload: path.join(__dirname, 'preload.js')
    // }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('capture.html')

  // Open the DevTools.
  mainWindow.webContents.openDevTools()
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  const nets = networkInterfaces();
  const results = {}

  for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
          // skip over non-ipv4 and internal (i.e. 127.0.0.1) addresses
          if (net.family === 'IPv4' && !net.internal && !name.toLowerCase().includes('virtual')) {
              if (!results[name]) {
                  results[name] = [];
              }

              results[name].push(net.address);
          }
      }
  }

  const ipaddress = results[Object.keys(results)[0]];

  http.listen(8082,  '0.0.0.0', () => {
    console.log(`listening on ${ipaddress}:8082`);
  });

  expressApp.get('/', (req, res) => {
    res.sendFile( __dirname + "/" + "index.html" );
  })

  expressApp.get('/watch', (req, res) => {
    console.log('----- Get watch file -----');
    res.sendFile( __dirname + "/" + "watch.html" );
  })

  io.sockets.on("connection", socket => {
    socket.on("broadcaster", () => {
      console.log('----- Broadcaster connected -----');
      broadcaster = socket.id;
      socket.broadcast.emit("broadcaster");
      socket.emit('ipaddress', ipaddress)

      if(software) {
        socket.emit('software', software)
      }

      if(phone) {
        socket.emit('phone')
      }
    });

    socket.on('getIpaddress', () => {
      socket.emit('ipaddress', ipaddress)
    })

    socket.on('phone', () => {
      console.log('----- Phone connected -----');
      phone = socket.id;
      if(software) {
        socket.emit('software', software)
      }
    })

    socket.on('software', data => {
      console.log('----- Software connected -----');
      console.log(data);
      software = data;
      software.id = socket.id;
      socket.to(broadcaster).emit('software', software)

      if(phone) {
        socket.to(phone).emit('software', software)
      }
    })

    socket.on("watcher", () => {
      console.log('----- Watcher connected -----');
      socket.to(broadcaster).emit("watcher", socket.id);
    });

    socket.on("offer", (id, message) => {
      socket.to(id).emit("offer", socket.id, message);
    });

    socket.on("answer", (id, message) => {
      socket.to(id).emit("answer", socket.id, message);
    });

    socket.on("candidate", (id, message) => {
      socket.to(id).emit("candidate", socket.id, message);
    });

    socket.on('selectCamera', data => {
      if(software) {
        socket.to(software.id).emit('selectCamera', data)
      }
    })

    socket.on('setFocalLength', data => {
      if(software) {
        socket.to(software.id).emit('setFocalLength', data)
      }
    })

    socket.on('setMovementMultiplier', data => {
      if(software) {
        socket.to(software.id).emit('setMovementMultiplier', data)
      }
    })

    socket.on('keyframes', data => {
      if(software) {
        socket.to(software.id).emit('keyframes', data)
      }
    })

    socket.on('transform', data => {
      if(software) {
        socket.to(software.id).emit('transform', data)
      }
    })

    socket.on('playback', data => {
      if(software) {
        socket.to(software.id).emit('playback', data)
      }
    })

    socket.on('goToStart', () => {
      if(software) {
        socket.to(software.id).emit('goToStart')
      }
    })

    socket.on('goToEnd', () => {
      if(software) {
        socket.to(software.id).emit('gotToEnd')
      }
    })

    socket.on('setFrame', frame => {
      if(software) {
        socket.to(software.id).emit('setFrame', frame)
      }
    })

    socket.on('close-software', () => {
      console.log('----- software disconnected -----');
      socket.disconnect(true)
      software = undefined
    })

    socket.on("disconnect", () => {
      socket.to(broadcaster).emit("disconnectPeer", socket.id);
    });
  });

  // const broadcastSocket = io
  //   .on('connection', socket => {
  //     console.log('----- Screen capture connected -----');
  //     broadcaster = socket.id
  //
  //     socket.on('broadcaster', () => {
  //       phoneSocket.emit('broadcaster')
  //     })
  //
  //     socket.on('offer', (id, message) => {
  //       phoneSocket.to(id).emit('offer', id, message)
  //     })
  //
  //     socket.on('answer', (id, message) => {
  //       phoneSocket.to(id).emit('answer', id, message)
  //     })
  //
  //     socket.on('candidate', (id, message) => {
  //       phoneSocket.to(id).emit('candidate', id, message)
  //     })
  //   })
  //
  // const softwareSocket = io
  //   .of('/software')
  //   .on('connection', socket => {
  //     console.log('----- A software connected -----');
  //     softwares[socket.id] = {
  //       socket: socket,
  //       software: undefined,
  //       scene: undefined,
  //       cameras: []
  //     }
  //
  //     socket.on("soft", data => {
  // 			console.log("software " + socket.id + " is: " + data.soft)
  // 			softs[socket.id].software = data.soft
  // 			softs[socket.id].scene = data.scene
  // 		});
  //   })
  //
  // const phoneSocket = io
  //   .of('/phone')
  //   .on('connection', socket => {
  //     console.log('----- A phone connected -----');
  //     if(phone) {
  //       return
  //     }
  //     phone = socket.id
  //     broadcastSocket.emit('watcher', socket.id)
  //
  //     socket.on('watcher', () => {
  //       broadcastSocket.emit('watcher', socket.id)
  //     })
  //
  //     socket.on('offer', (id, message) => {
  //       broadcastSocket.to(id).emit('offer', id, message)
  //     })
  //
  //     socket.on('answer', (id, message) => {
  //       broadcastSocket.to(id).emit('answer', id, message)
  //     })
  //
  //     socket.on('candidate', (id, message) => {
  //       broadcastSocket.to(id).emit('candidate', id, message)
  //     })
  //
  //     socket.on('disconnect', () => {
  //       broadcastSocket.emit('disconnectPeer', socket.id)
  //       phone = undefined
  //     })
  //   })

  shell.openExternal('http://localhost:8082/')
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
