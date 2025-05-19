//ElectronAPI Callbacks
window.electronAPI.receive('serverStatusReply',(server)=>{
    let shutDownBtn = document.getElementById('shutdown');    
    if(server.running){
        changeSection('./dashboard.html','mainSection');
        shutDownBtn.style.display = 'flex';        
        window.electronAPI.send('getDirInformation');
        window.electronAPI.send('getStorageInfo');
        window.electronAPI.send('getIpInfo');

    }else{
        changeSection('./startCreateServer.html','mainSection');
        shutDownBtn.style.display = 'none';
        console.log('Server Status Error : ',server.error);
        
    }
})


window.electronAPI.receive('replyInPopUp',(data)=>{
    popUpMessage(data);
});

window.electronAPI.receive('chooseRootPathCallback',(data)=>{
    let creatServerForm = document.getElementById('createServerForm');
    console.log(data);
    if(data.hasOwnProperty('error')){
        
        return ;
    }
    creatServerForm['full_root_path'].value = data.fullPath;
    let path = data.fullPath.split('/');

    if(path.length > 2){
        path = `../${path[path.length - 2]}/${path[path.length - 1]}`
    }else{
        path = data.fullPath;
    }
    creatServerForm['root_path'].value = path;    
    creatServerForm['space_available'].value = `${data.freeSpace} GB`;
})

window.electronAPI.receive('startServerReply',()=>{
    // changeSection('./dashboard.html','mainSection');
    window.electronAPI.send('serverStatus');

})
window.electronAPI.receive('stopServerReply', (err)=>{
    // if(!err){changeSection('./startCreateServer.html','mainSection')};
    window.electronAPI.send('serverStatus');
})

window.electronAPI.receive('getDirInformationReply',(data) =>{
    let directoryInfo = data.directoryInfo;
    let currentPath = data.currentPath;
    let dirTable = null;
    let svgs = {
        folder : `<svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 35C6.0375 35 5.21383 34.6576 4.529 33.9727C3.84417 33.2879 3.50117 32.4637 3.5 31.5V10.5C3.5 9.5375 3.843 8.71383 4.529 8.029C5.215 7.34417 6.03867 7.00117 7 7H17.5L21 10.5H35C35.9625 10.5 36.7868 10.843 37.4728 11.529C38.1587 12.215 38.5012 13.0387 38.5 14V31.5C38.5 32.4625 38.1576 33.2868 37.4728 33.9727C36.7879 34.6588 35.9637 35.0012 35 35H7Z" fill="#FFC800"/>
                    </svg>\n`,
        pdf : `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M20.0001 3.33325V14.1666C20.0001 14.8296 20.2635 15.4655 20.7323 15.9344C21.2012 16.4032 21.837 16.6666 22.5001 16.6666H33.3334V33.3333C33.3334 34.2173 32.9822 35.0652 32.3571 35.6903C31.732 36.3154 30.8841 36.6666 30.0001 36.6666H10.0001C9.11603 36.6666 8.26818 36.3154 7.64306 35.6903C7.01794 35.0652 6.66675 34.2173 6.66675 33.3333V6.66659C6.66675 5.78253 7.01794 4.93468 7.64306 4.30956C8.26818 3.68444 9.11603 3.33325 10.0001 3.33325H20.0001ZM18.3517 19.7466C17.9528 22.285 16.6253 24.5848 14.6267 26.1999C13.1484 27.3933 14.5001 29.7349 16.2734 29.0533C18.6715 28.1297 21.327 28.1297 23.7251 29.0533C25.4984 29.7366 26.8501 27.3949 25.3717 26.1999C23.3732 24.5848 22.0457 22.285 21.6467 19.7466C21.3517 17.8699 18.6467 17.8683 18.3517 19.7466ZM20.0001 23.8383L21.3434 26.1616H18.6601L20.0001 23.8383ZM23.3334 3.40492C23.9649 3.53884 24.5439 3.85324 25.0001 4.30992L32.3567 11.6666C32.8134 12.1228 33.1278 12.7018 33.2618 13.3333H23.3334V3.40492Z" fill="#D20000"/>
                </svg>\n`,
        image : `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.33333 35C7.41667 35 6.63222 34.6739 5.98 34.0217C5.32778 33.3694 5.00111 32.5844 5 31.6667V8.33333C5 7.41667 5.32667 6.63222 5.98 5.98C6.63333 5.32778 7.41778 5.00111 8.33333 5H31.6667C32.5833 5 33.3683 5.32667 34.0217 5.98C34.675 6.63333 35.0011 7.41778 35 8.33333V31.6667C35 32.5833 34.6739 33.3683 34.0217 34.0217C33.3694 34.675 32.5844 35.0011 31.6667 35H8.33333ZM10 28.3333H30L23.75 20L18.75 26.6667L15 21.6667L10 28.3333Z" fill="#5F54FF"/>
                </svg>\n`,
        video : `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M8.33341 3.33325C7.89139 3.33325 7.46746 3.50885 7.1549 3.82141C6.84234 4.13397 6.66675 4.55789 6.66675 4.99992V31.6666C6.66675 32.9927 7.19353 34.2644 8.13121 35.2021C9.0689 36.1398 10.3407 36.6666 11.6667 36.6666H28.3334C29.6595 36.6666 30.9313 36.1398 31.8689 35.2021C32.8066 34.2644 33.3334 32.9927 33.3334 31.6666V13.3333C33.3333 12.8913 33.1577 12.4674 32.8451 12.1549L24.5117 3.82159C24.1993 3.509 23.7754 3.33335 23.3334 3.33325H8.33341ZM23.3334 7.35659L29.3101 13.3333H23.3334V7.35659ZM24.1667 25.6099C24.4201 25.4636 24.6305 25.2532 24.7767 24.9999C24.923 24.7465 25 24.4591 25 24.1666C25 23.874 24.923 23.5866 24.7767 23.3333C24.6305 23.0799 24.4201 22.8695 24.1667 22.7233L19.1667 19.8366C18.9134 19.6903 18.626 19.6133 18.3334 19.6133C18.0409 19.6133 17.7535 19.6903 17.5001 19.8366C17.2467 19.9829 17.0363 20.1932 16.8901 20.4466C16.7438 20.7 16.6668 20.9874 16.6667 21.2799V27.0533C16.6668 27.3458 16.7438 27.6332 16.8901 27.8866C17.0363 28.1399 17.2467 28.3503 17.5001 28.4966C17.7535 28.6429 18.0409 28.7199 18.3334 28.7199C18.626 28.7199 18.9134 28.6429 19.1667 28.4966L24.1667 25.6099Z" fill="#F9589B"/>
                </svg>\n`,
        audio : `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.9167 31.6666C18.9723 31.6666 19.8612 31.3055 20.5834 30.5833C21.3056 29.861 21.6667 28.9721 21.6667 27.9166V21.6666H26.6667V18.3333H20.0001V24.7916C19.6945 24.5694 19.3684 24.4094 19.0217 24.3116C18.6751 24.2138 18.3067 24.1655 17.9167 24.1666C16.8612 24.1666 15.9723 24.5277 15.2501 25.2499C14.5279 25.9721 14.1667 26.861 14.1667 27.9166C14.1667 28.9721 14.5279 29.861 15.2501 30.5833C15.9723 31.3055 16.8612 31.6666 17.9167 31.6666ZM10.0001 36.6666C9.08341 36.6666 8.29897 36.3405 7.64675 35.6883C6.99453 35.036 6.66786 34.251 6.66675 33.3333V6.66659C6.66675 5.74992 6.99341 4.96547 7.64675 4.31325C8.30008 3.66103 9.08453 3.33436 10.0001 3.33325H23.3334L33.3334 13.3333V33.3333C33.3334 34.2499 33.0073 35.0349 32.3551 35.6883C31.7029 36.3416 30.9179 36.6677 30.0001 36.6666H10.0001ZM21.6667 14.9999H30.0001L21.6667 6.66659V14.9999Z" fill="#7A306C"/>
                </svg>\n`,
        excel : `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <mask id="mask0_8_15" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="2" y="2" width="33" height="36">
                    <path d="M6.6665 12.4999V4.99992C6.6665 4.55789 6.8421 4.13397 7.15466 3.82141C7.46722 3.50885 7.89114 3.33325 8.33317 3.33325H31.6665C32.1085 3.33325 32.5325 3.50885 32.845 3.82141C33.1576 4.13397 33.3332 4.55789 33.3332 4.99992V34.9999C33.3332 35.4419 33.1576 35.8659 32.845 36.1784C32.5325 36.491 32.1085 36.6666 31.6665 36.6666H8.33317C7.89114 36.6666 7.46722 36.491 7.15466 36.1784C6.8421 35.8659 6.6665 35.4419 6.6665 34.9999V27.4999" stroke="white" stroke-width="2.66667" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M25.8333 12.5H28.3333M23.3333 19.1667H28.3333M23.3333 25.8333H28.3333" stroke="white" stroke-width="2.66667" stroke-linecap="round"/>
                    <path d="M3.33325 12.5H18.3333V27.5H3.33325V12.5Z" fill="white" stroke="white" stroke-width="2.66667" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M8.33325 17.5L13.3333 22.5M13.3333 17.5L8.33325 22.5" stroke="black" stroke-width="2.66667" stroke-linecap="round" stroke-linejoin="round"/>
                    </mask>
                    <g mask="url(#mask0_8_15)">
                    <path d="M0 0H40V40H0V0Z" fill="#06BA63"/>
                    </g>
                </svg>`,
        other : `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.6667 14.9999V5.83325L30.8334 14.9999M10.0001 3.33325C8.15008 3.33325 6.66675 4.81659 6.66675 6.66659V33.3333C6.66675 34.2173 7.01794 35.0652 7.64306 35.6903C8.26818 36.3154 9.11603 36.6666 10.0001 36.6666H30.0001C30.8841 36.6666 31.732 36.3154 32.3571 35.6903C32.9822 35.0652 33.3334 34.2173 33.3334 33.3333V13.3333L23.3334 3.33325H10.0001Z" fill="#DCDCDC"/>
                </svg>\n`
    }
    let fileExtensions = {
        audio: [".mp3", ".wav", ".aac", ".ogg", ".flac", ".m4a", ".wma"],
        video: [".mp4", ".mkv", ".avi", ".mov", ".wmv", ".flv", ".webm", ".mpeg"],
        image: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".svg", ".webp"],
        pdf: [".pdf"],
        excel: [".xls", ".xlsx", ".csv"]
    };
    setTimeout(() => {
        // console.log(directoryInfo);
        
        dirTable = document.getElementById('dirTable');
        if(currentPath.length > 25){
            currentPath = `..${currentPath.slice(currentPath.length-25,currentPath.length)}`;
        }
        document.getElementById('currentPath').innerHTML = currentPath;
        let tableRowList = "";
        let svg = ""
        for(let fileOrDirectory of Object.keys(directoryInfo)){
            let file = fileOrDirectory;
            
            if(file.length > 50){file = `${file.slice(0,44)}..`}
            if(directoryInfo[fileOrDirectory].isFolder){
                svg = svgs.folder;
            }else if(directoryInfo[fileOrDirectory].isFile){
                let extension = directoryInfo[fileOrDirectory].extension;
                console.log(extension);
                
                if(fileExtensions.pdf.includes(extension)){svg = svgs.pdf}
                else if(fileExtensions.audio.includes(extension)){svg = svgs.audio}
                else if(fileExtensions.video.includes(extension)){svg = svgs.video}
                else if(fileExtensions.image.includes(extension)){svg = svgs.image}
                else if(fileExtensions.excel.includes(extension)){svg = svgs.excel}
                else{svg = svgs.other};
            }
            // console.log(fileExtensions.pdf.includes('.pdf'));
            let size = directoryInfo[fileOrDirectory].size;
            if(directoryInfo[fileOrDirectory].isFolder){size = ''}
            let tableRow = `
                <button class="tableRow" id="tableRow" index=${Object.keys(directoryInfo).indexOf(fileOrDirectory)}>
                    ${svg}
                    <p class="p-1">${file}</p>
                    <p class="p-2">${size}</p>
                </button>\n
            `;
            tableRowList = tableRowList+tableRow;
            // let element = document.createElement('div')
            // dirTable.insertAdjacentHTML('beforeend',tableRow);
        }
        dirTable.innerHTML = tableRowList;
        tableRowList ="";
    }, 10);
    
})

window.electronAPI.receive('getCurrentRootReply',(data)=>{
    setTimeout(() => {
        let currentPath = document.getElementById('currentPathInfo');
        let freeSpace = document.getElementById('freeSpace');
        currentPath.value = data.rootPath;
        freeSpace.value = `${data.freeSpace} GB` ;
        
    }, 20);
    
})

window.electronAPI.receive('getStorageInfoReply',storageInfo=>{
    // let infoList = '';
    // setTimeout(() => {
    //     let storageBar = document.getElementById('storageBar');
    //     let bgcolor = {
    //         pdf : '#D20000',
    //         video : '#F962A1',
    //         img : '#5F54FF',
    //         audio : '#7A306C',
    //         excel : '#06BA63',
    //         other : '#DCDCDC'
    //     }
    //     let color = '';
    //     for(let fileExt of Object.keys(percentData)){
    //         if(fileExt == 'pdf'){color = bgcolor.pdf}
    //         else if(fileExt == 'video'){color = bgcolor.video}
    //         else if(fileExt == 'audio'){color = bgcolor.audio}
    //         else if(fileExt == 'image'){color = bgcolor.img}
    //         else if(fileExt == 'excel'){color = bgcolor.excel}
    //         else{color = bgcolor.other}

    //         infoList += `<div style="background-color:${color}; width:${percentData[fileExt]}%;"></div>`
    //     }
    //     storageBar.innerHTML = infoList;
    // }, 20);

    setTimeout(() => {
        let storageBar = document.getElementById('storageBar');
        let totalDiv = document.getElementById('totalStorage');
        let freeDiv = document.getElementById('freeStorage');
        let divEel = `
            <div style="background-color:#F962A1; width:${(storageInfo.free/storageInfo.total).toFixed(2)*100}%;"></div>
        `
        storageBar.innerHTML = divEel;
        totalDiv.innerHTML = `Total : ${(storageInfo.total)} GB`;
        freeDiv.innerHTML = `Free : ${(storageInfo.free)} GB`;
    }, 20);
})

window.electronAPI.receive('getIpInfoReply',(ips)=>{
    setTimeout(() => {
        let svg = document.getElementById('NetworkSvg');
        let infoDiv = document.getElementById('ipInfo');
        let div = `
            <p class="p-1">Local IP :</p>
            <p class="p-2">${ips.localIp}</p>
            <p class="p-1">Public IP :</p>
            <p class="p-2">${ips.publicIp}</p>
            <p class="p-1">Email :</p>
            <p class="p-2">${ips.email}</p>
        `
        infoDiv.innerHTML = div;
        svg.innerHTML = ips.svg;
    }, 20);
})

window.electronAPI.receive('showFile',(data)=>{
    console.log(data);
    
    let dirTable = document.getElementById('dirTable');
    let mime = data.type.split(';')[0];
    let mimeOne = mime.split('/')[0];
    let mimeTwo = mime.split('/')[1];
    if(mimeOne == 'video' || mimeTwo == 'mp4'){
        let dataTag = `
            <video src="${data.url}" controls></video>
        `;
        console.log(dataTag);
        
        dirTable.innerHTML = dataTag;

    }else if(mimeOne == 'image'){
        let dataTag = `
            <img src="${data.url}"></img>
        `;
        console.log(dataTag);
        
        dirTable.innerHTML = dataTag;
    }
    else{
        let dataTag = `
            <iframe src="${data.url}" frameborder="0" class="fileFrame" allow="fullscreen;  allowtransparency="true"></iframe>
        `
        dirTable.innerHTML = dataTag;
    }
})