const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { log, dir } = require('node:console');
const path = require('node:path');
const fs = require('node:fs');
const { on } = require('node:events');
const { json } = require('node:stream/consumers');
const { hash,genSalt } = require('bcrypt');
const { startServer,stopServer,serverStatus, restartServer, getIps} = require('./expressHandler.js');
const fsr = require('fs-extra');
const mime = require('mime-types')
const CONFIG_PATH = path.resolve(__dirname,'..','config.json');
const PORT = 8000;
const HOST = '0.0.0.0';


const qrcode = require('qrcode');
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}


const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width:1400,
    height:850,
    minHeight:850,
    minWidth:1400,
    autoHideMenuBar:true,
    titleBarOverlay:true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
        color: '#131212',
        symbolColor: '#FFFFFF',
        height: 30
    },
    webPreferences: {
        contextIsolation:true,
        nodeIntegration:true,
        preload:path.join(__dirname,'preload.js'),
    }

  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname,'/html/index.html'));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
  // ipcMain.on('fetchCreateServerForm',(event)=>{

  // })
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

//ipcMain connections
ipcMain.on('chooseRootPath',(event)=>{
  let chooseFolder = dialog.showOpenDialog({properties:['openDirectory','multiSelections']})
  .then(callbackPromise=>{
    if(!callbackPromise.canceled){
      let rootPath = callbackPromise.filePaths[0];
      console.log(rootPath);
      
      fs.statfs(rootPath,(err,stats)=>{
          try {
            if(err){throw err};
            if(!fs.statSync(rootPath).isDirectory()){throw err}
            let freeSpace = ((stats.bsize * stats.bfree)/1e9).toFixed(2);
            let data = {
              freeSpace : freeSpace,
              fullPath : fs.realpathSync(rootPath)
            }
            console.log(data);
            
            event.reply('chooseRootPathCallback',data);
            return ;
          } catch (err) {
            log(err);
            let data = {
              error : true,
              message : 'Invalid Directory Path.'
            }
            console.log(data);
            
            event.reply('chooseRootPathCallback',data);
          }
        })
    }
  })
})

ipcMain.on('saveServerConfig',(event,config)=>{
  console.log(config);
  hash(config.password,10,(err,hashedPass) => {
    console.log(hashedPass);
    config.password = hashedPass;

    fs.writeFile(CONFIG_PATH,JSON.stringify(config),{flag : 'w+'},err => {
      if(!err){
        event.reply('replyInPopUp',{
          message : 'Server Created',
          nature : 'success'
        })
      }else{
        event.reply('replyInPopUp',{
          message : err,
          error : true,
          nature : 'error'
        })
      }
    })
  });
});

ipcMain.on('startServer',(event) => {
  console.log('start server log');
  fs.readFile(CONFIG_PATH,(err,data) => {
    console.log(err);
    try {
      if(err){throw 'No previous configuration!.'};
      startServer(PORT,HOST,(err)=>{
        console.log(err);
        
        if(err){throw err};
        console.log('no error');
        
        event.reply('startServerReply');
      });
      
    } catch (error) {      
      event.reply('replyInPopUp',{
        message : error,
        nature : 'error'
      })
    }
  })
});

ipcMain.on('serverStatus',(event)=>{
  serverStatus(PORT,(err)=>{
    try {
      if(err){throw err};
      event.reply('serverStatusReply',{running : true});
    } catch (error) {
      event.reply('serverStatusReply',{running : false,error : error});
    }
  })
});

ipcMain.on('getIpInfo',event=>{
  let ips = getIps(PORT);
  let email = fs.readFileSync(CONFIG_PATH);
  email = JSON.parse(email).recoveryEmail;
  ips.then(ipValues=>{
    // event.reply('getIpInfoReply',ips);
    if(ipValues.publicIp == 'Unavailable'){
      event.reply('replyInPopUp',{
        message : 'Public Ip Unavailable',
        nature : 'error'
      })
    }
    ipValues.email = email;
    event.reply('getIpInfoReply',ipValues);
  })
})

let dirStack = [];
function getCurrentPath(rootPath){
    let currentPath = rootPath;
    for(let content of dirStack){
        currentPath = path.resolve(currentPath,content);
    }
    return currentPath;
}

ipcMain.on('getDirInformation',(event,dirIndex)=>{
  // dirIndex = parseInt(dirIndex);
  fs.readFile(CONFIG_PATH,(err,data)=>{
    try{
      if(err){throw err};
      data = JSON.parse(data);
      let rootPath = data.rootPath;
      // console.log(rootPath);
      
      let currentPath = getCurrentPath(rootPath);
      let filesList = undefined;
      let mimeType = undefined;
      if(fs.statSync(currentPath).isDirectory()){
        filesList = fs.readdirSync(currentPath);
      }else{
        mimeType = mime.lookup(currentPath);
      }
      // console.log(dirIndex);
      // console.log(filesList);
      console.log(dirIndex);
      
      if(dirIndex){
        if (dirIndex > -1) {
          dirStack.push(filesList[dirIndex]);
        }else{
          dirStack.pop();
        }
        // (dirIndex > -1) ? dirStack.push(filesList[dirIndex]) : dirStack.pop();        
        currentPath = getCurrentPath(rootPath); 
        if(fs.statSync(currentPath).isDirectory()){
          filesList = fs.readdirSync(currentPath);
        }else{
          mimeType = mime.lookup(currentPath);
          filesList = undefined;
        }
      };
      // console.log(currentPath,dirStack,filesList,dirIndex);
      if(filesList){
        let directoryInfo = {};
        filesList.forEach(fileOrFolder => {
          let stat = fs.statSync(path.resolve(currentPath,fileOrFolder));
          // if(err){throw err};
          // console.log(currentPath,fileOrFolder,stat.size);
          let kb = stat.size / 1024;
          let mb = kb / 1024;
          let gb = mb / 1024;
          let size = 0;
          if(kb < 1000){
              size = `${kb.toFixed(2)} KB`;
          }else if(mb < 1000){
              size =  `${mb.toFixed(2)} MB`;
          }else{
              size = `${gb.toFixed(2)} GB`;
          }
          directoryInfo[fileOrFolder] = {
              isFolder : stat.isDirectory(),
              isFile : stat.isFile(),
              size : size,
              extension : path.extname(fileOrFolder)
          };
          // console.log(directoryInfo);
          // console.log(directoryInfo);
        })
        event.reply('getDirInformationReply',{currentPath,directoryInfo});
      }else{
        if(mimeType == false){
          mimeType = '';
        }
        event.reply('showFile',{url : currentPath,type : mimeType})
      }
    }catch (error){
      console.log(error);
      if(dirIndex){dirStack.pop()};
      event.reply('replyInPopUp',{
        message : 'Error in reading file',
        nature : 'error'
      })
    }
  })
})
ipcMain.on('getCurrentRoot',(event)=>{
  fs.readFile(CONFIG_PATH,(err,data)=>{
    data = JSON.parse(data);
    let currentRootPath = data.rootPath;
    let stats = fs.statfsSync(currentRootPath);
    let freeSpace = ((stats.bsize * stats.bfree)/1e9).toFixed(2);
    event.reply('getCurrentRootReply',{rootPath : currentRootPath,freeSpace : freeSpace});
  })
})


ipcMain.on('changeRootPath',(event)=>{
  let chooseFolder = dialog.showOpenDialog({properties:['openDirectory','multiSelections']})
  .then(callbackPromise=>{
    if(!callbackPromise.canceled){
      let configData = fs.readFileSync(CONFIG_PATH);
      configData = JSON.parse(configData);
      configData.rootPath = callbackPromise.filePaths[0];
      fs.writeFileSync(CONFIG_PATH,JSON.stringify(configData),{flag : 'w+'});
      app.quit();
      app.relaunch();
    }
  });
});

ipcMain.on('getStorageInfo',(event)=>{
  let rootPath = fs.readFileSync(CONFIG_PATH);
  rootPath = JSON.parse(rootPath).rootPath;
  let stats = fs.statfsSync(rootPath);
  let storageInfo = {
    total : ((stats.bsize * stats.blocks)/1e9).toFixed(2),
    free : ((stats.bsize * stats.bfree)/1e9).toFixed(2)
  }
  // console.log(storageInfo);
  event.reply('getStorageInfoReply',storageInfo);
})

ipcMain.on('stopServer',(event)=>{
  stopServer((err)=>{
    try{
      if(err){throw err};
      dirStack = [];
      event.reply('stopServerReply',null);
    }catch (error){
      event.reply('replyInPopUp',{message : error,
        nature : 'error'        
      });
    }
  })
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
