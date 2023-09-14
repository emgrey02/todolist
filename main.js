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
        ProjectManager.updateTodoIndices(relProject.index);
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
    const createProject = (name = 'Personal') => {
        let todoList = [];
        let index;

        return { name, todoList, index };
    };

    const assignIndex = (proj) => {
        let id = projects.indexOf(proj);
        proj.index = id;
    };

    const updateTodoIndices = (projIndex) => {
        let proj = getProject(projIndex);
        proj.todoList.forEach((todo, index) => {
            todo.index = index;
        });
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
        updateTodoIndices,
    };
})();

//one UIManager, so it is a module / IIFE
const UIManager = (() => {
    //create default project
    let newProj = ProjectManager.createProject();
    ProjectManager.addProject(newProj);

    //populate projects
    const populateProjectList = () => {
        let lowerNav = document.querySelector('ul.lower-nav');

        let projects = ProjectManager.getAllProjects();

        for (let i = 0; i < projects.length; i++) {
            let listElement = document.createElement('li');
            listElement.setAttribute('data-index', i);
            let btnElement = document.createElement('button');
            listElement.appendChild(btnElement);
            btnElement.innerText = projects[i].name;
            lowerNav.appendChild(listElement);
        }
    };

    populateProjectList();

    const addTaskBtn = document.querySelector('.add-task > button');
    const addTaskArea = document.querySelector('main .edit-area');
    const exitAddTaskArea = document.querySelector('button.exit');
    const addTaskForm = document.querySelector('.edit-area form');
    const theList = document.querySelector('div.the-list');
    const itemCont = document.querySelector('ul.ctn');

    const clearTodos = () => {
        while (itemCont.childElementCount != 1) {
            itemCont.lastChild.remove();
        }
    };

    const removeTodo = (target) => {
        let todoIndex =
            target.parentElement.parentElement.getAttribute('data-index');
        //make a copy...
        let todos = getTodos().slice(0);
        let todo = todos.filter((item) => item.index == todoIndex);
        TodoManager.removeTodoFromProject(todo[0]);
        populateTodos();
    };

    const getTodos = () => {
        let projectId = theList.getAttribute('data-projectId');
        return ProjectManager.getProject(projectId).todoList;
    };

    const populateTodos = () => {
        const listItem = document.querySelector('li.list-item');
        let todos = getTodos().slice(0);
        clearTodos();

        todos.forEach((item, index) => {
            let clone = listItem.cloneNode(true);
            itemCont.appendChild(clone);
            clone.style.display = 'grid';
            clone.setAttribute('data-index', index);
            document.querySelector(
                `li[data-index='${index}'] .text-ctn .title`,
            ).innerText = item.title;
            document.querySelector(
                `li[data-index='${index}'] .text-ctn .desc`,
            ).innerText = item.description;
            document.querySelector(
                `li[data-index='${index}'] .end .priority`,
            ).innerText = item.priority;
            document.querySelector(
                `li[data-index='${index}'] .end .date`,
            ).innerText = item.dueDate;
        });

        //add event listener for delete buttons
        let delBtn = document.querySelectorAll('button.delete');
        delBtn.forEach((btn) =>
            btn.addEventListener('click', (e) => {
                removeTodo(e.target);
            }),
        );

        console.log(getTodos());
    };

    populateTodos();

    const openAddTaskArea = () => {
        addTaskArea.style.visibility = 'initial';
        addTaskBtn.parentElement.style.display = 'none';
    };

    const closeAddTaskArea = () => {
        addTaskArea.style.visibility = 'hidden';
        addTaskBtn.parentElement.style.display = 'flex';
    };

    const submitTask = () => {
        const formData = new FormData(addTaskForm);
        let valueArray = [];
        for (const value of formData.values()) {
            valueArray.push(value);
        }
        let newTodo = TodoManager.createTodo(
            valueArray[0],
            valueArray[1],
            valueArray[2],
            valueArray[3],
            +theList.getAttribute('data-projectId'),
        );
        TodoManager.addTodoToProject(newTodo);
        populateTodos();
        closeAddTaskArea();
    };

    //add a task
    addTaskBtn.addEventListener('click', () => {
        openAddTaskArea();
    });

    exitAddTaskArea.addEventListener('click', () => {
        closeAddTaskArea();
    });

    addTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        submitTask();
    });

    //delete a task
})();

//tests

//create a new task
//user presses button
//user fills in values for:
//title, description
