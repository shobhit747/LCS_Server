window.electronAPI.send('serverStatus');


function changeSection(filePath,divId){
    fetch(filePath)
        .then(response => response.text())
        .then(data => {
            document.getElementById(divId).innerHTML = data;
        })
        .catch(error => console.error('Error loading section:', error));
}

let waitForElement = async(elementId,property,propertyValue) =>{
    return new Promise((resolve)=>{
        let observer = new MutationObserver((mutations,obs) =>{
            let element = document.getElementById(elementId);
            if(element){
                obs.disconnect();
                resolve(element);
            }
        })
        observer.observe(document.getElementById('mainSection'),{subtree:true,childList:true});
    })
}

function popUpMessage(messageObj){
    let messageElement = document.getElementById('popUpMessage');
    let messageElementMsg = document.getElementById('popUpMessageMsg');
    let animationAndStyle = () => {
        if(messageObj.hasOwnProperty('nature')){
            if(messageObj.nature == 'success'){
                messageElement.style.backgroundColor = 'green';
            }else if(messageObj.nature == 'error'){
                messageElement.style.backgroundColor = '#910808';
            }
        }else{
            messageElement.style.backgroundColor = '#7A306C';
        }
        console.log(messageObj);
        
        setTimeout(() => {
            messageElement.style.display = 'flex';
            setTimeout(() => {
                messageElement.style.scale = '1';
                setTimeout(() => {
                    messageElementMsg.innerHTML = messageObj.message;
                    messageElement.style.width = `${messageObj.message.length}em`;
                    setTimeout(() => {
                        messageElementMsg.style.display = 'block';
                        setTimeout(() => {
                            messageElementMsg.style.opacity = '1';
                        }, 100);
                    }, 200);
                },200);
            }, 100);
        }, 100);
        
        setTimeout(() => {
            messageElementMsg.style.opacity = '0';
            setTimeout(() => {
                messageElementMsg.style.display = 'none';
                setTimeout(() => {
                    messageElement.style.width = '28px';
                    setTimeout(() => {
                        messageElement.style.scale = '0';
                        setTimeout(() => {
                            messageElement.style.display = 'none';
                        }, 200);
                    }, 200);
                }, 100);
            }, 200);
        }, 5000);        
    }
    
    let style = window.getComputedStyle(messageElement),
        display = style.getPropertyValue('display');
    if(display == 'flex'){
        setTimeout(() => {
            animationAndStyle();
        }, 4000);
    }else{
        animationAndStyle();
    }
    
};



