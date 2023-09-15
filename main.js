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

    const editTodo = (newTodoObj, taskIndex) => {
        let relProject = getProjectFromTodo(newTodoObj);
        relProject.todoList[taskIndex] = newTodoObj;
        relProject.todoList[taskIndex].index = taskIndex;
    };

    const toggleCompletion = (todoObj) => {
        todoObj.completed = !todoObj.completed;
    };

    return {
        createTodo,
        addTodoToProject,
        removeTodoFromProject,
        editTodo,
        toggleCompletion,
    };
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

    const editProject = (newTitle, projIndex) => {
        projects[projIndex].name = newTitle;
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
    let editProjMode = false;
    let editTaskMode = false;

    //create default project
    let newProj = ProjectManager.createProject();
    ProjectManager.addProject(newProj);

    // set project's title
    const setProjTitle = (projIndex) => {
        let projTitle = document.querySelector('div.the-list h2');
        projTitle.innerText = ProjectManager.getProject(projIndex).name;
    };

    // show appropriate todo items based on the project
    const showProjTodos = (projIndex) => {
        theList.setAttribute('data-projectId', projIndex);
        setProjTitle(projIndex);
        populateTodos();
    };

    const updateProjectTitle = (projName, projIndex) => {
        if (projIndex == theList.getAttribute('data-projectId')) {
            let projTitle = document.querySelector('div.the-list h2');
            projTitle.innerText = projName;
        }
    };

    //clear project list
    const clearProjectList = () => {
        let lowerNav = document.querySelector('ul.lower-nav');

        while (lowerNav.childElementCount != 1) {
            lowerNav.lastChild.remove();
        }
    };

    const addProjectEventListeners = () => {
        // add event listeners to buttons
        // also handles adding/removing delete btns
        let projBtns = document.querySelectorAll(
            `li[data-id] button:not([class])`,
        );

        //handle delete btns
        let delBtns = document.querySelectorAll('.delete-proj');
        delBtns.forEach((btn) => {
            if (editProjMode) {
                btn.style.display = 'block';
                let projIndex = btn.parentElement.getAttribute('data-id');
                btn.addEventListener('click', () => {
                    deleteProject(projIndex);
                });
            } else {
                btn.style.display = 'none';
            }
        });

        //handle project buttons
        projBtns.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                if (editProjMode) {
                    openAddProjectArea(e);
                    addHighlight(e.target.parentElement);
                } else {
                    showProjTodos(
                        +e.target.parentElement.getAttribute('data-id'),
                    );
                }
            });
        });
    };

    //populate project list
    const populateProjectList = () => {
        let lowerNav = document.querySelector('ul.lower-nav');

        let projects = ProjectManager.getAllProjects();

        clearProjectList();

        for (let i = 0; i < projects.length; i++) {
            let listElement = document.createElement('li');
            listElement.setAttribute('data-id', i);
            let btnElement = document.createElement('button');
            let deleteBtn = document.createElement('button');
            deleteBtn.innerText = 'x';
            deleteBtn.classList.add('delete-proj');
            listElement.appendChild(btnElement);
            listElement.appendChild(deleteBtn);
            btnElement.innerText = projects[i].name;
            lowerNav.appendChild(listElement);

            if (!editProjMode) {
                deleteBtn.style.display = 'none';
            }
        }

        addProjectEventListeners();
    };

    //initial population
    populateProjectList();

    // DOM objects

    // add Task objects
    const addTaskBtn = document.querySelector('.add-task > button');
    const addTaskArea = document.querySelector('main .edit-area');
    const exitAddTaskArea = document.querySelector('.edit-area button.exit');
    const addTaskForm = document.querySelector('.edit-area form');
    const taskTitle = document.querySelector('.edit-area .text-ctn input');

    // to-do list objects
    const theList = document.querySelector('div.the-list');
    const itemCont = document.querySelector('ul.ctn');

    // add project objects
    const newProjectBtn = document.querySelector(`div.lists-title .add-proj`);
    const editProjectBtn = document.querySelector('div.lists-title .edit-proj');
    const addProjectBtn = document.querySelector(
        `div.btns button[type='submit']`,
    );
    const cancelAddProjectBtn = document.querySelector(
        `div.btns button[type='button']`,
    );

    // clear all todos //
    // except the first one which is display: none and used for cloning //
    const clearTodos = () => {
        while (itemCont.childElementCount != 1) {
            itemCont.lastChild.remove();
        }
    };

    // removes todo from DOM and from Project Object
    const removeTodo = (target) => {
        let todoIndex =
            target.parentElement.parentElement.getAttribute('data-index');
        // make a copy with slice - don't want to alter actual todos
        let todos = getTodos();

        // get the todo object from its index
        let todoObj = todos[todoIndex];

        // remove it
        TodoManager.removeTodoFromProject(todoObj);

        // repopulate DOM
        populateTodos();
    };

    // put in editTaskMode - boolean
    // opens edit task area - place next to / in place of item?
    // highlights list item
    const editTodo = (target) => {
        editTaskMode = true;
        addHighlight(target.parentElement.parentElement);
        openAddTaskArea(target);
    };

    // toggles whether the item is completed or not
    const toggleCheck = (target) => {
        let listItem = target.parentElement.parentElement;
        let todoIndex = listItem.getAttribute('data-index');
        let todos = getTodos();
        let todoObj = todos[todoIndex];
        TodoManager.toggleCompletion(todoObj);

        if (todoObj.completed) {
            target.innerText = 'done';
            target.nextElementSibling.style.textDecoration = 'line-through';
        } else {
            target.innerText = '[]';
            target.nextElementSibling.style.textDecoration = 'none';
        }
    };

    // gets a list of todos from the current project
    // we get the current project from a data attribute in the html
    // we set this data attribute when we click a project in the nav
    const getTodos = () => {
        let projectId = theList.getAttribute('data-projectId');
        return ProjectManager.getProject(projectId).todoList || null;
    };

    // populates DOM with todo list based on project
    const populateTodos = () => {
        const listItem = document.querySelector('li.list-item');
        let todos = getTodos()?.slice(0);

        // first, clear the DOM
        clearTodos();

        // repopulate DOM
        todos.forEach((item, index) => {
            // use what's already in html
            let clone = listItem.cloneNode(true);
            itemCont.appendChild(clone);
            clone.style.display = 'grid';

            // this helps us connect DOM item to todo item
            clone.setAttribute('data-index', index);

            // input data into correct html elements
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
        let delBtns = document.querySelectorAll('button.delete');
        delBtns.forEach((btn) =>
            btn.addEventListener('click', (e) => {
                removeTodo(e.target);
            }),
        );

        //add event listener for edit buttons
        let editTaskBtns = document.querySelectorAll('.list-item button.edit');
        editTaskBtns.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                editTodo(e.target);
            });
        });

        //add event listener for completed buttons
        let completedBtns = document.querySelectorAll(
            '.list-item button.checkbox',
        );
        completedBtns.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                toggleCheck(e.target);
            });
        });
    };

    // initial population of todo items
    populateTodos();

    // called when we click the plus button to add a task
    // opens the form to add a task and puts focus on the first input element
    const openAddTaskArea = () => {
        addTaskArea.style.visibility = 'initial';
        addTaskBtn.parentElement.style.display = 'none';
        taskTitle.focus();

        if (editTaskMode) {
            let itemIndex = document
                .querySelector('.list-item.highlight')
                .getAttribute('data-index');
            let todoObj = getTodos()[itemIndex];
            addTaskArea.setAttribute('data-edit', itemIndex);

            document.querySelector('#edit-title').value = todoObj.title;
            document.querySelector('#edit-desc').value = todoObj.description;
            document.querySelector('#due-date').value = todoObj.dueDate;
            document.querySelector('#priority').value = todoObj.priority;
            document.querySelector('.add-task-btn button').innerText =
                'Confirm Edit';
        } else {
            document.querySelector('.add-task-btn button').innerText =
                'Add Task';
            addTaskArea.removeAttribute('data-edit');
        }
    };

    // closes the form when exited or when submitted
    const closeAddTaskArea = () => {
        addTaskArea.style.visibility = 'hidden';
        addTaskBtn.parentElement.style.display = 'flex';

        if (editTaskMode) {
            editTaskMode = false;
            removeHighlight(
                document.querySelector(
                    `.list-item[data-index='${addTaskArea.getAttribute(
                        'data-edit',
                    )}']`,
                ),
            );
        }
        //reset form values
        addTaskForm.reset();
    };

    // creates a todo object from entered form data
    const submitTask = () => {
        // get form values
        const formData = new FormData(addTaskForm);
        let valueArray = [];
        for (const value of formData.values()) {
            valueArray.push(value);
        }

        // create todo object
        let newTodo = TodoManager.createTodo(
            valueArray[0],
            valueArray[1],
            valueArray[2],
            valueArray[3],
            +theList.getAttribute('data-projectId'),
        );

        if (!editTaskMode) {
            // add todo object to current project
            TodoManager.addTodoToProject(newTodo);
        } else {
            // edit the todo object
            TodoManager.editTodo(
                newTodo,
                +document
                    .querySelector('.list-item.highlight')
                    .getAttribute('data-index'),
            );
        }

        //re-populate list with new todo added
        populateTodos();

        //close form
        closeAddTaskArea();
    };

    // highlights the list item we are editing
    const addHighlight = (listEl) => {
        listEl.classList.add('highlight');
    };

    // removes highlight on list item
    const removeHighlight = (listEl) => {
        listEl.classList.remove('highlight');
    };

    // opens area to add or edit a new project
    const openAddProjectArea = (e) => {
        let addProjArea = document.querySelector('div.new-proj');
        let titleInput = document.querySelector('#project-title');

        //make it visible
        addProjArea.style.display = 'block';

        // if we're in editmode
        if (editProjMode && !e.target.classList.contains('add-proj')) {
            // toggleHighlight(e.target.parentElement);
            document.querySelector('.input-ctn label').innerText =
                'Edit your list name:';
            document.querySelector('#project-title').value = e.target.innerText;
            document.querySelector('.btns button:last-child').innerText =
                'Confirm';
            addProjArea.setAttribute(
                'data-edit',
                +e.target.parentElement.getAttribute('data-id'),
            );
        } else {
            document.querySelector('.input-ctn label').innerText =
                'Give your list a name:';
            document.querySelector('#project-title').value = '';
            document.querySelector('.btns button:last-child').innerText = 'Add';
            addProjArea.removeAttribute('data-edit');
        }

        titleInput.focus();
    };

    const closeAddProjectArea = () => {
        let addProjArea = document.querySelector('div.new-proj');
        addProjArea.style.display = 'none';
        let form = document.querySelector('div.new-proj form');

        if (editProjMode) {
            removeHighlight(
                document.querySelector(
                    `li[data-id='${addProjArea.getAttribute('data-edit')}']`,
                ),
            );
        }

        form.reset();
    };

    const submitProject = () => {
        let addProjArea = document.querySelector('div.new-proj');
        let projName = document.querySelector(
            'div.new-proj #project-title',
        ).value;

        if (!editProjMode) {
            let newProj = ProjectManager.createProject(projName);
            ProjectManager.addProject(newProj);
        } else {
            ProjectManager.editProject(
                projName,
                +addProjArea.getAttribute('data-edit'),
            );
            updateProjectTitle(
                projName,
                +addProjArea.getAttribute('data-edit'),
            );
        }

        populateProjectList();

        closeAddProjectArea();
    };

    const deleteProject = (projIndex) => {
        if (ProjectManager.getAllProjects().length === 1) {
            alert('you must have at least one project');
        } else {
            ProjectManager.removeProject(projIndex);
            populateProjectList();
        }
    };

    const editProjects = () => {
        // boolean for editProjMode
        editProjMode = !editProjMode;
        if (editProjMode) {
            editProjectBtn.innerText = 'stop editing';
            newProjectBtn.style.display = 'none';
        } else {
            editProjectBtn.innerText = 'edit';
            newProjectBtn.style.display = 'block';
        }
        addProjectEventListeners();
    };

    // event listeners
    addTaskBtn.addEventListener('click', openAddTaskArea);

    exitAddTaskArea.addEventListener('click', closeAddTaskArea);

    addTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        submitTask();
    });

    newProjectBtn.addEventListener('click', (e) => openAddProjectArea(e));

    cancelAddProjectBtn.addEventListener('click', closeAddProjectArea);

    addProjectBtn.addEventListener('click', (e) => {
        e.preventDefault();
        submitProject();
    });

    editProjectBtn.addEventListener('click', editProjects);
})();

//tests

//create a new task
//user presses button
//user fills in values for:
//title, description
