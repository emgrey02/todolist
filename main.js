import './css/style.css';

//there is one todoManager, so it will be a module IIFE
//it's job is to manage todo objects, create/delete/edit
const TodoManager = (() => {
    //factory function to create todo objects
    const createTodo = (
        title,
        description,
        dueDate,
        priority,
        projectId = 0,
    ) => {
        return {
            title,
            description,
            dueDate,
            priority,
            completed: false,
            projectId,
            index: undefined,
        };
    };

    const getProjectFromTodo = (todoObj) => {
        return ProjectManager.getProject(todoObj.projectId);
    };

    const assignIndex = (todoObj) => {
        let relProject = getProjectFromTodo(todoObj);
        todoObj.index = relProject.todoList.indexOf(todoObj);
    };

    const addTodoToProject = (todoObj) => {
        let relProject = getProjectFromTodo(todoObj);
        relProject.todoList.push(todoObj);
        assignIndex(todoObj);
    };

    const removeTodoFromProject = (todoObj) => {
        let relProject = getProjectFromTodo(todoObj);
        relProject.todoList.splice(todoObj.index, 1);
    };

    const editTodo = (todoObj) => {
        let relProject = getProjectFromTodo(todoObj);
        relProject.todoList[todoObj.index] = todoObj;
    };

    return { createTodo, addTodoToProject, removeTodoFromProject, editTodo };
})();

//only one ProjectManager, so module / IIFE
//handles project creation , adding todo objects to projects
const ProjectManager = (() => {
    let projects = [];

    //factory function for projects - there will be many
    //default project
    const createProject = (name = 'Default') => {
        let todoList = [];
        let index;

        return { name, todoList, index };
    };

    const assignIndex = (proj) => {
        let id = projects.indexOf(proj);
        proj.index = id;
    };

    const addProject = (proj) => {
        projects.push(proj);
        assignIndex(proj);
    };

    const getProject = (projIndex) => {
        return projects[projIndex];
    };

    const editProject = (projObj) => {
        projects[projObj.index].title = projObj.title;
        projects[projObj.index].todoList = projObj.todoList;
    };

    const removeProject = (index) => {
        projects.splice(index, 1);
    };

    const getAllProjects = () => {
        return projects;
    };

    return {
        createProject,
        getAllProjects,
        addProject,
        getProject,
        editProject,
        removeProject,
    };
})();

//one UIManager, so it is a module / IIFE
const UIManager = (() => {})();

//tests
let newProj = ProjectManager.createProject();
let secondProj = ProjectManager.createProject('Shopping List');
ProjectManager.addProject(newProj);
ProjectManager.addProject(secondProj);

let newTodo = TodoManager.createTodo(
    'lalala',
    'wow will this work?',
    new Date(),
    'important',
);
console.log(newTodo);

TodoManager.addTodoToProject(newTodo);

let projects = ProjectManager.getAllProjects();

console.log(projects);

//create a new task
//user presses button
//user fills in values for:
//title, description
