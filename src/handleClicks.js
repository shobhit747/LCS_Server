document.getElementById('mainSection').addEventListener('click', (event) =>{

    if(event.target.closest('button')){
        let buttonClicked = event.target.closest('button');
        console.log(buttonClicked.id);
        
        //start server handler
        if(buttonClicked.id == 'start_server'){
            window.electronAPI.send('startServer');
        }
        //create server button handler
        if(buttonClicked.id == 'create_server'){
            changeSection('./createServerForm.html','mainSection')
        }

        //choose dir button handler
        else if(buttonClicked.id == 'chooseRoot'){
            window.electronAPI.send('chooseRootPath');
        }

        //create server form submit handler
        else if(buttonClicked.id == 'submitServerInfo'){
            let form = document.getElementById('createServerForm');
            form.onsubmit = () =>{
                try {
                    if(form['password'].value == form['confirm_password'].value){
                        let config = {
                            rootPath : form['full_root_path'].value,
                            password : form['password'].value,
                            recoveryEmail : form['recovery_email'].value,
                        }
                        console.log(config);
                        window.electronAPI.send('saveServerConfig',config);
                    }else{
                        throw {message:"Password Mismatch.",nature : 'error'};
                    }
                } catch (error) {
                    popUpMessage(error)
                }    
                return false;
            }
        }

        else if(buttonClicked.id == 'tableRow'){
            let index = buttonClicked.getAttribute('index');
            window.electronAPI.send('getDirInformation',index)
        }

        else if(buttonClicked.id == 'backDir'){
            window.electronAPI.send('getDirInformation','-1')
        }
        else if(buttonClicked.id == 'changeRoot'){
            changeSection('./changeRootForm.html','dirTable');
            window.electronAPI.send('getCurrentRoot');
        }
        else if(buttonClicked.id == 'changeRootPath'){
            console.log('changing');
            
            window.electronAPI.send('changeRootPath');
        }
    }
})

document.getElementById('header').addEventListener('click',(event)=>{
    if(event.target.closest('button')){
        let buttonClicked = event.target.closest('button');
        console.log(buttonClicked.id);
        
        //shut down server handler
        if(buttonClicked.id == 'shutdown'){
            window.electronAPI.send('stopServer');
        }
    }
})