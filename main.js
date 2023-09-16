import './css/style.css';
import { format, parse, compareAsc } from 'date-fns';

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
    //default project is named 'Personal'
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

    const listAllTodos = () => {
        let allTodos = [];
        let todoCollection = projects.map((proj) => proj.todoList);
        allTodos = todoCollection.flat();
        return allTodos;
    };

    const getTodayTodos = () => {
        let allTodos = listAllTodos();
        let todaysDate = format(new Date(), 'MMM d');
        let todayTodos = allTodos.filter((todo) => {
            return todo.dueDate == todaysDate;
        });
        return todayTodos;
    };

    const getUpcomingTodos = () => {
        let allTodos = listAllTodos();
        let todaysDate = new Date();
        let upcomingTodos = allTodos.filter((todo) => {
            return (
                compareAsc(
                    todaysDate,
                    parse(todo.dueDate, 'MMM d', new Date()),
                ) == -1
            );
        });
        return upcomingTodos;
    };

    const assignFromStorage = () => {
        projects = StorageManager.getLocalStorageProjects();
    };

    return {
        createProject,
        getAllProjects,
        addProject,
        getProject,
        editProject,
        removeProject,
        updateTodoIndices,
        listAllTodos,
        getTodayTodos,
        getUpcomingTodos,
        assignFromStorage,
    };
})();

//one UIManager, so it is a module / IIFE
const UIManager = (() => {
    let editProjMode = false;
    let editTaskMode = false;

    // set project's title
    // const setProjTitle = (projIndex) => {
    //     let projTitle = document.querySelector('div.the-list h2');
    //     projTitle.innerText = ProjectManager.getProject(projIndex).name;
    // };

    // show appropriate todo items based on the project
    const showProjTodos = (projIndex) => {
        let name;
        theList.setAttribute('data-projectId', projIndex);

        if (+projIndex || +projIndex === 0) {
            name = ProjectManager.getProject(projIndex).name;
        } else {
            console.log('wehooo');
            switch (projIndex) {
                case 'all':
                    name = 'All Todos';
                    break;
                case 'today':
                    name = 'Today';
                    break;
                case 'upcoming':
                    name = 'Upcoming';
                    break;
                default:
                    break;
            }
        }
        updateProjectTitle(name, projIndex);
        populateTodos();
    };

    // this changes the project title when we select a project from the sidebar
    const updateProjectTitle = (projName, projIndex) => {
        if (projIndex == theList.getAttribute('data-projectId')) {
            let projTitle = document.querySelector('div.the-list h2');
            projTitle.innerText = projName;
        }
        StorageManager.updateLocalStorage();
    };

    //clear project list
    const clearProjectList = () => {
        let lowerNav = document.querySelector('ul.lower-nav');

        while (lowerNav.childElementCount != 1) {
            lowerNav.lastChild.remove();
        }
    };

    // we call this when our Project List is updated...
    // there's lots of new buttons to listen to
    const updateProjectListEventListeners = () => {
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

        updateProjectListEventListeners();
    };

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

    // top nav buttons
    let allTodosBtn = document.querySelector(
        '.upper-nav li:first-child button',
    );
    let todayBtn = document.querySelector('.upper-nav li:nth-child(2) button');
    let upcomingBtn = document.querySelector('.upper-nav li:last-child button');

    // clear all todos //
    // except the first one which is display: none and used for cloning //
    const clearTodos = () => {
        while (itemCont.childElementCount != 1) {
            itemCont.lastChild.remove();
        }
    };

    // we call this when we are removing or editing a task, on any page
    const getCorrectTodoObj = (target) => {
        let correctTodoObj;
        let domItemIndex;
        let domItemProj;

        // get the project id - can be a number or 'all todos', 'today', or 'upcoming'
        let projId = theList.getAttribute('data-projectId');

        // we get todos for this page
        let listedTodos = getTodos();

        //if we're editing
        if (editTaskMode) {
            domItemIndex = +document
                .querySelector('.list-item.highlight')
                .getAttribute('data-index');

            // if we're removing
        } else {
            domItemIndex =
                +target.parentElement.parentElement.getAttribute('data-index');
        }

        // reassign / get correct todoObj if we are viewing 'all todos', 'today', or 'upcoming'
        if (projId == 'all' || projId == 'today' || projId == 'upcoming') {
            correctTodoObj = listedTodos.find((todo) => {
                let itemProj = todo.projectId;
                let itemIndex = todo.index;
                if (editTaskMode) {
                    domItemProj = +document
                        .querySelector('.list-item.highlight')
                        .getAttribute('data-projId');
                } else {
                    domItemProj =
                        +target.parentElement.parentElement.getAttribute(
                            'data-projId',
                        );
                }
                return itemProj == domItemProj && itemIndex == domItemIndex;
            });
        } else {
            // get the todoObj with the index we got
            correctTodoObj = listedTodos[domItemIndex];
        }

        return correctTodoObj;
    };

    // removes todo from DOM and from Project Object
    const removeTodo = (target) => {
        // get the todo object from its index
        let todoObj = getCorrectTodoObj(target);

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
        console.log('clicked edit button');
        console.log(
            'projects(before we open input area):',
            ProjectManager.getAllProjects(),
        );
        openTaskInputArea(target);
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

        switch (projectId) {
            case 'all':
                return ProjectManager.listAllTodos();
            case 'today':
                return ProjectManager.getTodayTodos();
            case 'upcoming':
                return ProjectManager.getUpcomingTodos();
            default:
                return ProjectManager.getProject(+projectId).todoList;
        }
    };

    // populates DOM with todo list based on project
    const populateTodos = () => {
        // update localstorage
        StorageManager.updateLocalStorage();
        // get our hidden listItem that we will use for cloning
        const listItem = document.querySelector('li.list-item');

        // get the todos for the current project / category
        let todos = getTodos();

        // first, clear the DOM
        clearTodos();

        // repopulate DOM
        todos.forEach((item, index) => {
            // use what's already in html, clone the node deeply
            // and make visible
            let clone = listItem.cloneNode(true);
            itemCont.appendChild(clone);
            clone.style.display = 'grid';

            let projId = theList.getAttribute('data-projectid');

            // if we are populating a project
            // if data attribute is a number rather than a string ( we don't want 0 to be false)
            if (+projId || +projId === 0) {
                console.log('populating a project');
                // this helps us connect DOM item to todo item
                clone.setAttribute('data-index', index);

                // input data into correct html elementsS
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

                addTaskBtn.parentElement.style.display = 'flex';

                // else we are populating 'all tasks', 'today', or 'upcoming'
            } else {
                console.log('populating all todos, today, or upcoming');
                // connect each todo to its OG index and project
                clone.setAttribute('data-index', item.index);
                clone.setAttribute('data-projId', item.projectId);

                // input data into correct html elements
                document.querySelector(
                    `li.list-item:last-child .text-ctn .title`,
                ).innerText = item.title;
                document.querySelector(
                    `li.list-item:last-child .text-ctn .desc`,
                ).innerText = item.description;
                document.querySelector(
                    `li.list-item:last-child .end .priority`,
                ).innerText = item.priority;
                document.querySelector(
                    `li.list-item:last-child .end .date`,
                ).innerText = item.dueDate;

                // this doesn't work?
                addTaskBtn.parentElement.style.display = 'none';
            }
        });

        // we make event listeners now since new elements are created

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

        //add event listener for completed buttons (task checkbox)
        let completedBtns = document.querySelectorAll(
            '.list-item button.checkbox',
        );
        completedBtns.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                toggleCheck(e.target);
            });
        });
    };

    // called when we click the plus btn to add a new task, or the edit button on a task to edit a task
    // both open the same form element to add/edit a task, and puts focus on the first input element
    const openTaskInputArea = () => {
        // make form visible
        addTaskArea.style.visibility = 'initial';

        // remove the 'Add Task' btn since we are now adding one
        addTaskBtn.parentElement.style.display = 'none';

        //focus on the first input in the form - the task title
        taskTitle.focus();

        // if the user clicked the 'edit' button on a task
        if (editTaskMode) {
            // we retrieve the correct todoObj
            let todoObj = getCorrectTodoObj();

            // connects this form element to the current task you're editing
            // so later when we edit the task, we know by it's 'data-edit' attribute
            // what it's index is in the project's todoList
            addTaskArea.setAttribute('data-edit', todoObj.index);

            // we provide the user a pre filled-in form so they can edit the info
            document.querySelector('#edit-title').value = todoObj.title;
            document.querySelector('#edit-desc').value = todoObj.description;

            let formattedDate =
                todoObj.dueDate !== ''
                    ? format(
                          parse(todoObj.dueDate, 'MMM d', new Date()),
                          'yyyy-MM-dd',
                      )
                    : '';

            document.querySelector('#due-date').value = formattedDate;

            document.querySelector('#priority').value = todoObj.priority;
            document.querySelector('.add-task-btn button').innerText =
                'Confirm Edit';

            // if the user clicked the plus btn to add a new task
        } else {
            // set submit button text
            document.querySelector('.add-task-btn button').innerText =
                'Add Task';

            // this area isn't connected to a previous task, we're making a new one.
            // we don't need this label
            addTaskArea.removeAttribute('data-edit');
        }

        // go to submitTask to see the rest of what happens after
    };

    // closes the form when exited or when submitted
    // removes the highlight
    const closeAddTaskArea = () => {
        addTaskArea.style.visibility = 'hidden';

        let projId = theList.getAttribute('data-projectId');

        addTaskBtn.parentElement.style.display = 'flex';

        if (editTaskMode) {
            editTaskMode = false;

            if (projId == 'all' || projId == 'today' || projId == 'upcoming') {
                addTaskBtn.parentElement.style.display = 'none';
            }

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
        // get form values the user entered
        const formData = new FormData(addTaskForm);

        // put it in a nice array
        let valueArray = [];
        for (const value of formData.values()) {
            valueArray.push(value);
        }

        // format date
        if (valueArray[2] != '') {
            valueArray[2] = parse(valueArray[2], 'yyyy-MM-dd', new Date());
            valueArray[2] = format(valueArray[2], 'MMM d');
        }

        let currentListItem;
        let projId = theList.getAttribute('data-projectId');

        if (
            editTaskMode &&
            (+projId == 'all' || +projId == 'today' || +projId == 'upcoming')
        ) {
            currentListItem = document.querySelector(
                `.list-item.highlight[data-index]`,
            );
            projId = +currentListItem.getAttribute('data-projId');
        } else if (editTaskMode) {
            currentListItem = document.querySelector(
                `.list-item.highlight[data-index]`,
            );
            projId = +theList.getAttribute('data-projectId');
        } else {
            projId = +theList.getAttribute('data-projectId');
        }

        // create todo object with TodoManager
        // we get the project index from the parent element of this todo list
        // or the list item itself if we are in 'all todos', 'today', or 'upcoming'
        let newTodo = TodoManager.createTodo(
            valueArray[0],
            valueArray[1],
            valueArray[2],
            valueArray[3],
            projId,
        );

        // if we aren't editing a task and submitting a new one
        if (!editTaskMode) {
            // add todo object to current project
            TodoManager.addTodoToProject(newTodo);

            // if we are editing a previous task
        } else {
            // give data to TodoManager to edit the todo
            TodoManager.editTodo(
                newTodo,
                +currentListItem.getAttribute('data-index'),
            );
        }

        //re-populate list with new todo added / current todo edited
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

        console.log('projects:', ProjectManager.getAllProjects());
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
        updateProjectListEventListeners();
    };

    const listAllTodos = () => {
        theList.setAttribute('data-projectId', 'all');
        updateProjectTitle('All Todos', 'all');
        populateTodos();
    };

    const listTodayTodos = () => {
        theList.setAttribute('data-projectId', 'today');
        updateProjectTitle('Today', 'today');
        populateTodos();
    };

    const listUpcomingTodos = () => {
        theList.setAttribute('data-projectId', 'upcoming');
        updateProjectTitle('Upcoming', 'upcoming');
        populateTodos();
    };

    // event listeners
    addTaskBtn.addEventListener('click', openTaskInputArea);

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

    allTodosBtn.addEventListener('click', listAllTodos);

    todayBtn.addEventListener('click', listTodayTodos);

    upcomingBtn.addEventListener('click', listUpcomingTodos);

    return { populateProjectList, populateTodos, showProjTodos };
})();

const StorageManager = (() => {
    const updateLocalStorage = () => {
        localStorage.setItem(
            'projects',
            JSON.stringify(ProjectManager.getAllProjects()),
        );
        localStorage.setItem(
            'page',
            document.querySelector('.the-list').getAttribute('data-projectid'),
        );
    };

    const getLocalStorageProjects = () => {
        return JSON.parse(localStorage.getItem('projects')) || '';
    };

    const getLocalStoragePage = () => {
        console.log(localStorage.getItem('page'));
        return localStorage.getItem('page');
    };

    return { updateLocalStorage, getLocalStorageProjects, getLocalStoragePage };
})();

//create default project
if (StorageManager.getLocalStorageProjects() == '') {
    let newProj = ProjectManager.createProject();
    ProjectManager.addProject(newProj);
    StorageManager.updateLocalStorage();
} else {
    ProjectManager.assignFromStorage();
    UIManager.showProjTodos(StorageManager.getLocalStoragePage());
}

UIManager.populateProjectList();
UIManager.populateTodos();
