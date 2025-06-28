import React from "react";
import ToDoList from "./ToDoList";


//create your first component
const Home = () => {
	return (
		<div>
        <h1 className="text-center" style={{fontSize:"8rem"}}> ToDos</h1>
		<ToDoList/>
		</div>
	);
};

export default Home;