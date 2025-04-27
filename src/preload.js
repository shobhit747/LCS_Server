// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { ipcRenderer, contextBridge } = require("electron");



contextBridge.exposeInMainWorld(
    'electronAPI', {
    send: (channel,data) =>{
        let validChannels = ['chooseRootPath','saveServerConfig','startServer','stopServer','serverStatus'
            ,'getDirInformation','getCurrentRoot','changeRootPath','getStorageInfo','getIpInfo'
        ];
        if(validChannels.includes(channel)){
            ipcRenderer.send(channel,data);
        }
    },
    receive: (channel,callback) =>{
        let validChannels = ['chooseRootPathCallback','replyInPopUp','startServerReply','stopServerReply','serverStatusReply'
            ,'getDirInformationReply','getCurrentRootReply','getStorageInfoReply','getIpInfoReply','showFile'
        ];
        if(validChannels.includes(channel)){
            ipcRenderer.on(channel,(_event, ...args) => callback(...args));
        }
    }
})