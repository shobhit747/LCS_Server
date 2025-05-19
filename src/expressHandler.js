const express = require('express');
const fs = require('node:fs');
const http = require('http')
const app = express();
const readline = require("node:readline");
const path = require('node:path');
const { EventEmitter } = require('node:stream');
const { log } = require('node:console');
const { send } = require('node:process');
const session = require('express-session');
const crypto = require('crypto');
const os = require('os');
const https = require('https');
const { default: axios } = require('axios');
const qrcode = require('qrcode');
const mime = require('mime-types');
const { compareSync } = require('bcrypt');

// Middleware to parse JSON
app.use(express.json()); 
app.use(express.raw({type : 'application/octet-stream',limit : '100gb'}))
// Middleware to parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log(sessionSecret);

let sessionMiddleware = session({
    secret:sessionSecret,
    resave : false,
    saveUninitialized : true,
    cookie : {secure : false,httpOnly : true}, // change it later (secure : true, while using https)
    store : new session.MemoryStore(),
});

app.use(sessionMiddleware)

let USERS = [];

function requireAuthentication(req,res,next){
    console.log(req.session);
    
    if(!req.session.userId){
        
        if(req.method == 'POST' && req.body['passwrd'] != undefined){
            let password = req.body['passwrd'];
            let encryptedPassword = fs.readFileSync(path.resolve(__dirname,'..','config.json'));
            encryptedPassword = JSON.parse(encryptedPassword);
            encryptedPassword = encryptedPassword.password;
            if(compareSync(password,encryptedPassword)){
                console.log('Password matched');
                let userId = Math.random().toString(36).substring(7);
                USERS.push(userId);
                req.session.userId = userId; // Assign random ID
                if (!req.session.stack) {
                    req.session.stack = []; // Initialize stack for each session
                }
                next();
            }else{
                req.session.destroy();
                console.log('did not match');
                res.sendStatus(401);
            }
        }
    }else{
        console.log('HAS SESSION :',req.session);
        if(USERS.includes(req.session.userId)){            
            next();
        }else{
            res.sendStatus(401);
        }
    }
}

app.use('/file',requireAuthentication,express.static(getRootPath()))

function getRootPath(){
    try {
        let rootPath = fs.readFileSync(path.resolve(__dirname,'..','config.json'));
        rootPath = JSON.parse(rootPath);
        return rootPath.rootPath;
    } catch (error) {
        return '.';
    }
}

// let dirStack = [];
function getCurrentPath(rootPath,dirStack){
    let currentPath = rootPath;
    for(let content of dirStack){
        currentPath = path.resolve(currentPath,content);
    }
    return currentPath;
}

app.post('/',requireAuthentication,(req,res)=>{

    console.log(req.headers);
    
    let rootPath = getRootPath();
    let currentPath = getCurrentPath(rootPath,req.session.stack);
    if(!fs.statSync(currentPath).isDirectory()){
        req.session.stack = [];
        currentPath = getCurrentPath(rootPath,req.session.stack);
    }
    let directoryContent = fs.readdirSync(currentPath);
    let directoryInfo = {};

    directoryContent.forEach(fileOrFolder => {            
        let stat = fs.statSync(path.resolve(currentPath,fileOrFolder));
        let kb = stat.size / 1024;
        let mb = kb / 1024;
        let gb = mb / 1024;
        let size = 0;
        if(kb < 1000){
            size = `${kb.toFixed(2)}KB`;
        }else if(mb < 1000){
            size =  `${mb.toFixed(2)}MB`;
        }else{
            size = `${gb.toFixed(2)}GB`;
        }
        directoryInfo[fileOrFolder] = {
            isFolder : stat.isDirectory(),
            isFile : stat.isFile(),
            size : size,
            extension : path.extname(fileOrFolder)
        };
    })

    let stats = fs.statfsSync(rootPath);
    let storageInfo = {
        total : ((stats.bsize * stats.blocks)/1e9).toFixed(2),
        free : ((stats.bsize * stats.bfree)/1e9).toFixed(2)
    }
    res.status(200).send({storageInfo,directoryInfo,currentPath : currentPath});
})


app.post('/getDirectory',requireAuthentication,(req,res) => {
    console.log(req.headers);
    console.log('cookie');
    
    
    if(req.body != undefined){
        if(Object.hasOwn(req.body,"cd")){
            let body = req.body;
            if(body.cd == ".."){
                req.session.stack.pop();
                // dirStack.pop();
            }else if(body.cd == "." || body.cd == ""){
            }else{
                req.session.stack.push(body.cd);
                // dirStack.push(body.cd);
            }
        };  
    }    
    let rootPath = getRootPath();
    let currentPath = getCurrentPath(rootPath,req.session.stack);
    let stackTop = req.session.stack[req.session.stack.length - 1];
    
    try{
        let stat = fs.statSync(currentPath);
        if(stat.isFile()){
            try {
                res.setHeaders(new Headers({
                    'Content-Disposition' : `inline; filename=${stackTop}`,
                    'Content-Type' : mime.lookup(currentPath)
                }))
                res.send({
                    filePath : `/file${currentPath.replace(rootPath,"")}`
                    // filePath : currentPath
                }).status(200)
            } catch (error) {
                // res.status(415).send({
                //     error : "TypeError: invalid media type"
                // });
                // req.session.stack.pop();
                // res.sendStatus(415);
                try{
                    res.setHeader('content-type','*/*');
                    res.status(200);
                    res.send({
                        filePath : `/file${currentPath.replace(rootPath,"")}`
                    })
                }catch(error){
                    req.session.stack.pop();
                    res.sendStatus(415);
                }
                // res.removeHeader('content')
            }
            
        }
        else{
            let directoryContent = fs.readdirSync(currentPath);
            let directoryInfo = {};
            directoryContent.forEach(fileOrFolder => {            
                let stat = fs.statSync(path.resolve(currentPath,fileOrFolder));
                let kb = stat.size / 1024;
                let mb = kb / 1024;
                let gb = mb / 1024;
                let size = 0;
                if(kb < 1000){
                    size = `${kb.toFixed(2)}KB`;
                }else if(mb < 1000){
                    size =  `${mb.toFixed(2)}MB`;
                }else{
                    size = `${gb.toFixed(2)}GB`;
                }
                directoryInfo[fileOrFolder] = {
                    isFolder : stat.isDirectory(),
                    isFile : stat.isFile(),
                    size : size,
                    extension : path.extname(fileOrFolder)
                };
            })

            res.status(200).send({userId: req.session.userId,directoryInfo,currentPath : currentPath});
        }
    }catch (error){
        err = {
            message : "file/directory does not exists.",
            nature : 'error'
        }
        console.log(error);
        
        req.session.stack = [];
        // res.status(400).send(error);
    }
});

app.post('/rename',requireAuthentication,(req,res)=>{

});

app.post('/upload',requireAuthentication,(req,res)=>{
    let filename = req.headers['content-disposition'].split('=')[1];
    let filePath = path.resolve(getCurrentPath(getRootPath(),req.session.stack),filename);
    let writeStream = fs.createWriteStream(filePath)
    writeStream.write(req.body,(err)=>{
        if(err){
            console.error(err);
            res.sendStatus(500);
        }
        else{
            console.log('File Saved in : ',filePath);
            res.sendStatus(200);
        };
    })
});

app.get('/localServerCheck',(req,res,next)=>{
    next();
})

app.get('/download',requireAuthentication,(req,res)=>{
    let fileToDownload = `${getCurrentPath(getRootPath(),req.session.stack)}/${req.body.fileName}`;
    try{
        if(fs.existsSync(fileToDownload)){
            res.download(fileToDownload,req.body.fileName,(err)=>{
                if(err){throw err};
            })
        }else{
            res.sendStatus(404);
        }
    }catch(err){
        console.log(err);
        res.sendStatus(500);
    }
    
});

app.delete('/delete',requireAuthentication,(req,res)=>{

});




let server = null;
function serverStatus(port,handleErr){
    http.get(`http://localhost:${port}/localServerCheck`,(res)=>{        
        handleErr(null);
    }).on('error',(err)=>{
        console.log('status error : ',err);
        
        handleErr(err);
    })
}



const getLocalIP = () => {
    const interfaces = os.networkInterfaces();
    for (const interfaceName in interfaces) {
        for (const net of interfaces[interfaceName]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address; // Return the first non-internal IPv4 address
            }
        }
    }
    return 'localhost'; // Fallback if no network IP is found
};

const getPublicIP = async () => {
    try {
        const response = await axios.get('https://api64.ipify.org?format=json');
        console.log(response.data);
        
        return response.data.ip;
    } catch (error) {
        console.error('Error fetching public IP:', error.message);
        return 'Unavailable';
    }
};
async function getIps(port) {
    let publicIp =  await getPublicIP();
    let localIp = getLocalIP();
    if(publicIp != 'Unavailable'){publicIp = `${publicIp}:${port}`}
    let data = {localIp : `${localIp}:${port}`,publicIp : `${publicIp}`}
    let jsonData = JSON.stringify(data)
    qrcode.toString(jsonData,{type:'svg'},(err,code)=>{
        if(err){console.log(err)}
        else{
            data.svg = code;
        }
    })
    return data;
}

async function startServer(port, host, handleErr) {
    if (!server) {
        try {
            server = app.listen(port, host, (err) => {
                if (err) {
                    throw new Error('Error: Cannot start server.');
                }
                let localIp = getLocalIP();
                console.log(`Server started at: http://${localIp}:${port}`);
                handleErr(null);
            });

            // Set server timeouts
            server.keepAliveTimeout = 5000; // Keep-alive timeout (5 seconds)
            server.requestTimeout = 10000; // Request timeout (10 seconds)

            // Log new connections
            server.on('connection', (socket) => {
                const clientAddress = socket.remoteAddress;
                console.log(`New connection from: ${clientAddress}`);

                socket.on('close', () => {
                    console.log(`Connection closed: ${clientAddress}`);
                });

                socket.on('timeout', () => {
                    console.log(`Connection timeout: ${clientAddress}`);
                    socket.destroy(); // Destroy timed-out socket
                });
            });

            server.on('error', (error) => {
                console.error('Server error:', error);
                handleErr(error);
            });

        } catch (error) {
            handleErr(error);
        }
    }
}


function stopServer(handleErr){
    if(server){
        server.close((err)=>{
            try {
                if(err){throw 'error : cannot stop server.'}
                console.log('Server Stopped');
                server = null;
                handleErr(null);
            } catch (error) {
                handleErr(error);
            }
        })
    }
}

function restartServer(port,handleErr){
    if(server){
        server.close(err=>{
            try{
                if(err){throw err};
                server = app.listen(port,(err)=>{
                    if(err){throw 'error : cannot start server.'}
                    console.log(`Server started at : http://localhost:${port}`);
                })
                app.use((req, res, next) => {
                    req.session.stack = [];
                    next();
                });
                handleErr(null);
            }catch (err){
                handleErr(err);
            }
        })
    }
}
module.exports = {startServer,stopServer,serverStatus,restartServer,getIps};