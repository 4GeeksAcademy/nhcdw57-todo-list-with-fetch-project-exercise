import React, { useEffect, useRef, useState } from "react";



//create your first component
const ToDoList = () => {
    const [tasks, setTasks] = useState([]);
    /* tasks = [ {…}, {…}, {…}, {…} ]
        0: Object { label: "Make the Bed", is_done: false, id: 5 }
        1: Object { label: "Wash my hands", is_done: false, id: 6 }
        2: Object { label: "Eat", is_done: false, id: 7 }
        3: Object { label: "Walk the dog", is_done: false, id: 8 }*/
    const [input, setInput] = useState("");
    const hasSetupRun = useRef(false); //prevents setup from running twice from StrictMode


    async function accessAPIServer(action, taskID = null, newValue = null, userName = "tester") {
        let actions = ['CreateUser', 'ReadUser', 'CreateTask', 'DeleteTask', 'UpdateTask'];
        let heading = { 'Content-Type': 'application/json' };
        //double checks if the function is being used correctly
        let check = actions.indexOf(action);
        if (check === -1) { // if action doesnt match preset actions
            return Promise.reject(new Error(`Invalid use of the accessAPIServer method, Inputed action: ${action} Valid actions: ${actions}`));
        } else if (check === 0) { //Create User
            return fetch(`https://playground.4geeks.com/todo/users/${userName}`, { method: 'POST' });
        } else if (check === 1) { //Read User
            return fetch(`https://playground.4geeks.com/todo/users/${userName}`);
        } else if (check === 2 && newValue != null) { //Create Task
            let taskBody = { "label": newValue, "is_done": false };
            return fetch(`https://playground.4geeks.com/todo/todos/${userName}`, { method: "POST", headers: heading, body: JSON.stringify(taskBody) });
        } else if (check === 3 && taskID != null) { //Delete Task
            return fetch(`https://playground.4geeks.com/todo/todos/${taskID}`, { method: "DELETE" });
        } else if (check === 4 && taskID != null && newValue != null) { //Update Task
            return fetch(`https://playground.4geeks.com/todo/todos/${taskID}`, { method: "PUT", headers: heading, body: JSON.stringify(newValue) });
        } else { //if somehow none of the above executes, there's something wrong
            return Promise.reject(new Error(`Encountered logic error or utilized inadequate arguments within accessAPIServer method. Attempted Action: ${actions[check]}`));
        }
    }



    async function setup() {
        try { // loads User tasks
            let rawUserData = await accessAPIServer('ReadUser');
            if (rawUserData.status === 404) {
                throw new Error("The fetch did not find the user. Making a fetch POST attempt.");
            }
            let userData = await rawUserData.json();
            console.log(userData.todos);
            setTasks(userData.todos);
        } catch (error) { // if User not found (due to API getting wiped) remake the user with default tasks
            console.error(error.message);
            try {
                let rawUserData = await accessAPIServer('CreateUser');
                if (!rawUserData.ok) {
                    throw new Error("Both fetches failed. Application possibly will not function correctly.");
                }
                await accessAPIServer('CreateTask', null, 'Make the Bed');
                await accessAPIServer('CreateTask', null, 'Wash my hands');
                await accessAPIServer('CreateTask', null, 'Eat');
                await accessAPIServer('CreateTask', null, 'Walk the dog');
                rawUserData = await accessAPIServer('ReadUser');
                if (rawUserData.status === 404) {
                    throw new Error("The fetch did not find the user. The server might be messed up.");
                }
                let userData = await rawUserData.json();
                setTasks(userData.todos);
            } catch (error) {
                console.error(error.message);
            }
        }
    }

    async function getTasksFromAPI() {
        try {
            let rawUserData = await accessAPIServer('ReadUser');
            if (rawUserData.status === 404) {
                throw new Error("The fetch did not find the user.");
            }
            let userData = await rawUserData.json();
            return userData.todos
        } catch (error) {
            console.error(error.message);
            return null;
        }

    }

    async function deleteAll(){
        let check = await getTasksFromAPI();
        if(check.length !== 0){
            for(let task of tasks){
                await deleteItem(task.id);
            }
            
            
        }
        
    }

    useEffect(() => {
        if (!hasSetupRun.current) { //prevents StrictMode from running the setup twice
            setup();
            hasSetupRun.current = true;
        }
    }, []);


    async function enterKeyOnInput(event) {
        if (event.key === "Enter") {
            //update tasks by adding it to the list on the server
            await accessAPIServer('CreateTask', null, event.target.value);
            //set the task to the retrived list from the server
            const updatedTasks = await getTasksFromAPI();
            setTasks(updatedTasks);
            setInput("");
        }
    }

    async function toggleFinished(index, id) {
        let newBody = {
            "label": tasks[index].label,
            "is_done": !tasks[index].is_done
        }
        await accessAPIServer('UpdateTask', id, newBody);
        const updatedTasks = await getTasksFromAPI();
        setTasks(updatedTasks);
    }

    async function deleteItem(id){
        await accessAPIServer('DeleteTask', id);
        const updatedTasks = await getTasksFromAPI();
        setTasks(updatedTasks);
    }


    let mappedToDoList = (tasks.length === 0) ?
        [<li className="list-group-item fs-3 d-flex justify-content-between" key={0}>There's nothing to do... </li>] :
        tasks.map((object, index) => {
            let classes = (object.is_done) ? "list-group-item fs-3 d-flex justify-content-between bg-success" : "list-group-item fs-3 d-flex justify-content-between";
            return <li className={classes}
                key={index}
                onClick={() => toggleFinished(index, object.id)}>
                {object.label}
                <button type="button" className="btn delete-btn text-danger p-0" onClick={() => deleteItem(object.id)}>
                    <i className="bi bi-x-lg p-2 bg-danger-subtle"></i>
                </button>
            </li>
        });
   


    return (
        <div className="container-fluid">
            <div className="row d-flex justify-content-center">
                <div className="col-3">
                    <ul className="list-group">
                        <li className="list-group-item p-0"><input type="text" className="form-control biig fs-3" placeholder="What needs to be done?" value={input} onKeyDown={enterKeyOnInput} onChange={(e) => setInput(e.target.value)} /></li>
                        {mappedToDoList}
                        <li className="list-group-item">{tasks.length} {(tasks.length === 1) ? "item" : "items"} left</li>
                    </ul>
                </div>
            </div>
            <div className="row d-flex justify-content-center">
                <div className="col-3">
                    <button type="button" className="btn btn-danger mt-3" onClick={deleteAll}>Delete All Tasks</button>
                </div>
            </div>
        </div>
    );
};

export default ToDoList;

 // let mappedToDoList = tasks.map((object, index) => {
    //     let classes = (object.is_done) ? "list-group-item fs-3 d-flex justify-content-between bg-success" : "list-group-item fs-3 d-flex justify-content-between";
    //     return <li className={classes} 
    //     key={index} 
    //     onClick={() => toggleFinished(index,object.id)}>{object.label} <button type="button" className="btn delete-btn text-danger p-0" onClick={() => deleteItem(index)}><i className="bi bi-x-lg p-2 bg-danger-subtle"></i></button></li>
    // });
    // (tasks.length === 0) ?
    //     [<li className="list-group-item fs-3 d-flex justify-content-between" key={0}>There's nothing to do... </li>] :




// let userData = fetch("https://playground.4geeks.com/todo/users/tester")
//     .then((data) => {
//         if (!data.ok) {
//             throw new Error("First Fetch failed, attempting to fetch post.")
//         }
//         return data.json()
//     })
//     .catch((error) => {
//         console.log(error.message);
//         let newData = {
//             "name": "tester"
//         }
//         return fetch("https://playground.4geeks.com/todo/users/tester", {
//             method: "POST", headers: {

//                 'Content-Type': 'application/json'

//             }, body: JSON.stringify(newData)
//         })
//             .then((response) => {
//                 if (!response.ok) {
//                     throw new Error("Failed to create a fetch as well. ToDo site will not work properly.")
//                 }
//                 return response.json()
//             })
//     })
//     .then((response)=>console.log(response))
//     .catch((error) => console.log(error.message));