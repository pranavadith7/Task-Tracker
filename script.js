// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc, getDoc, setDoc, query, where, writeBatch } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyAj06OfnGYpMuuCkgfd8vdSqyJKeFhZFcU",
    authDomain: "to-do-list-9bd7d.firebaseapp.com",
    projectId: "to-do-list-9bd7d",
    storageBucket: "to-do-list-9bd7d.appspot.com",
    messagingSenderId: "107134873289",
    appId: "1:107134873289:web:8dcc76a3dda2bcdc842718",
    measurementId: "G-TNRD57QRW1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
window.getDocs = getDocs;
window.collection = collection;
window.db = db;
window.addDoc = addDoc;
window.getDoc = getDoc;
window.deleteDoc = deleteDoc;
window.setDoc = setDoc;
window.query = query;
window.where = where;


const tasks = document.querySelectorAll('.task');

let draggingTask = null;

tasks.forEach(task => {
    task.addEventListener('dragstart', () => {
        draggingTask = task;
        task.classList.add('dragging');
    });

    task.addEventListener('dragend', () => {
        draggingTask.classList.remove('dragging');
        draggingTask = null;
    });
});

const columns = document.querySelectorAll('.col-3');

columns.forEach(column => {
    column.addEventListener('dragover', e => {
        e.preventDefault();
        const afterElement = getDragAfterElement(column, e.clientY);
        const container = afterElement ? afterElement.parentElement : column.querySelector('.list-group');
        container.insertBefore(draggingTask, afterElement);
    });
});

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function addTask() {
    const newTaskForm = document.getElementById('new-task-form');
    const newTaskInput = document.getElementById('new-task-input');
    const newTaskPriority = document.getElementById('new-task-priority');

    const taskText = newTaskInput.value.trim();
    const taskPriority = newTaskPriority.value;

    let iconClass, badgeColorClass;
    if (taskPriority === 'low') {
        iconClass = 'bi bi-arrow-down-circle-fill';
        badgeColorClass = 'bg-success';
    } else if (taskPriority === 'medium') {
        iconClass = 'bi bi-dash-circle-fill';
        badgeColorClass = 'bg-warning';
    } else if (taskPriority === 'high') {
        iconClass = 'bi bi-arrow-up-circle-fill';
        badgeColorClass = 'bg-danger';
    }

    const newTask = document.createElement('div');
    newTask.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center', 'task');
    newTask.draggable = true;
    newTask.innerHTML = `
                ${taskText}
                <span class="badge rounded-pill ${badgeColorClass}">
                    <i class="${iconClass}"></i>
                </span>
            `;

    const backlogList = document.getElementById('backlog');
    backlogList.appendChild(newTask);

    // Add event listeners for drag and drop
    addDragListeners(newTask);

    // Clear the input field after adding a new task
    newTaskInput.value = '';
}

const newTaskForm = document.getElementById('new-task-form');
const newTaskInput = document.getElementById('new-task-input');
const newTaskPriority = document.getElementById('new-task-priority');

newTaskForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior

    // Get the task text and priority from the input fields
    const taskText = newTaskInput.value.trim();
    const taskPriority = newTaskPriority.value;
    const projectCode = document.getElementById('new-task-code').value;

    const backlogQuerySnapshot = await getDocs(query(collection(db, "backlog"), where("id", "==", projectCode)));
    const todoQuerySnapshot = await getDocs(query(collection(db, "todo"), where("id", "==", projectCode)));
    const inProgressQuerySnapshot = await getDocs(query(collection(db, "inprogress"), where("id", "==", projectCode)));
    const completedQuerySnapshot = await getDocs(query(collection(db, "completed"), where("id", "==", projectCode)));
    let count = backlogQuerySnapshot.size;
    count += todoQuerySnapshot.size;
    count += inProgressQuerySnapshot.size;
    count += completedQuerySnapshot.size;

    // Add the task to Firestore
    try {
        await addDoc(collection(db, "backlog"), {
            task: taskText,
            priority: taskPriority,
            id: projectCode,
            count: count + 1
        });
        // Clear the input field after adding the task
        newTaskInput.value = '';
        // Refresh the display of the todo list

    } catch (error) {
        console.error("Error adding task to Firestore: ", error);
    }
    addTask();
    displayTodoList();
});

// ------------------------------------------------------
function removeAllListeners(element) {
    const clonedElement = element.cloneNode(true);
    element.replaceWith(clonedElement);
    return clonedElement;
}


function addDeleteListener(deleteButton, docId, collectionName) {
    deleteButton.addEventListener('click', async (event) => {
        // await console.log(docId);
        // await console.log(event.target.dataset);
        // await console.log(event.target);
        document.getElementById('backlog').innerHTML = '';
        try {
            // Delete the task document from Firestore
            await deleteDoc(doc(db, collectionName, docId));
            // Call displayTodoList to refresh the list
            displayTodoList();
        } catch (error) {
            console.error("Error deleting task: ", error);
        }
    });
}

function addEventListenersToTasks() {
    const tasks = document.querySelectorAll('.task');
    tasks.forEach(task => {
        addDragListeners(task);
        const deleteButton = task.querySelector('.delete-btn');
        if (deleteButton) {
            const docId = deleteButton.dataset.docid;
            const collectionName = deleteButton.closest('.list-group').id;
            addDeleteListener(deleteButton, docId, collectionName);
        }
    });
}

function createTaskElement(taskData, docId, collectionName) {
    const taskElement = document.createElement('div');
    taskElement.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center', 'task');
    taskElement.setAttribute('data-docid', docId);

    const projectCode = document.getElementById("new-task-code").value;

    let badgeColorClass = '';
    let priorityIcon = '';

    switch (taskData.priority) {
        case 'high':
            badgeColorClass = 'bg-danger';
            priorityIcon = '<i class="bi bi-arrow-up-circle-fill"></i>';
            break;
        case 'medium':
            badgeColorClass = 'bg-warning';
            priorityIcon = '<i class="bi bi-dash-circle-fill"></i>';
            break;
        case 'low':
            badgeColorClass = 'bg-success';
            priorityIcon = '<i class="bi bi-arrow-down-circle-fill"></i>';
            break;
        default:
            badgeColorClass = 'bg-primary';
            priorityIcon = '<i class="bi bi-dash-circle-fill"></i>';
    }

    taskElement.innerHTML = `
        <span>${taskData.task}</span>
        <div class="d-flex align-items-center">
            <span class="badge bg-primary rounded-pill mr-2 badge-text">${taskData.count}</span>
            <span class="badge ${badgeColorClass} rounded-pill mr-2">${priorityIcon}</span>
            <button class="btn btn-outline-danger delete-btn" data-docid="${docId}"><i class="bi bi-trash-fill"></i></button>
        </div>
    `;

    const deleteButton = taskElement.querySelector('.delete-btn');
    addDeleteListener(deleteButton, docId, collectionName);

    return taskElement;
}

async function getSequenceNumber(projectCode) {
    const backlogQuerySnapshot = await getDocs(query(collection(db, "backlog"), where("id", "==", projectCode)));
    const todoQuerySnapshot = await getDocs(query(collection(db, "todo"), where("id", "==", projectCode)));
    const inProgressQuerySnapshot = await getDocs(query(collection(db, "inprogress"), where("id", "==", projectCode)));
    const completedQuerySnapshot = await getDocs(query(collection(db, "completed"), where("id", "==", projectCode)));
    let count = backlogQuerySnapshot.size;
    count += todoQuerySnapshot.size;
    count += inProgressQuerySnapshot.size;
    count += completedQuerySnapshot.size;
    // console.log(count);
    return count + 1;
}

// Function to add drag event listeners
function addDragListeners(task) {
    task.setAttribute('draggable', true); // Ensure the task is draggable
    task.addEventListener('dragstart', (event) => {
        draggingTask = event.target; // Use event.target to get the task being dragged
        draggingTask.classList.add('dragging');
        event.dataTransfer.setData('taskId', task.getAttribute('data-docid'));
        event.dataTransfer.setData('sourceCollection', task.parentElement.id);
    });

    task.addEventListener('dragend', () => {
        draggingTask.classList.remove('dragging');
        draggingTask = null;
    });
}

var backlogListDataElements = [];
var todoListDataElements = [];
var inProgressListDataElements = [];
var completedListDataElements = [];

function setTodoListElementsList() {

    let backlogListElm = document.getElementById('backlog');
    backlogListElm.innerHTML = '';
    backlogListDataElements.forEach((taskElement) => {
        backlogListElm.appendChild(taskElement);
    });

    let todoListElm = document.getElementById('todo');
    todoListElm.innerHTML = '';
    todoListDataElements.forEach((taskElement) => {
        todoListElm.appendChild(taskElement);
    });

    let inProgressListElm = document.getElementById('inprogress');
    inProgressListElm.innerHTML = '';
    inProgressListDataElements.forEach((taskElement) => {
        inProgressListElm.appendChild(taskElement);
    });

    let completedListElm = document.getElementById('completed');
    completedListElm.innerHTML = '';
    completedListDataElements.forEach((taskElement) => {
        completedListElm.appendChild(taskElement);
    });
}


async function displayTodoList() {

    const projectCode = document.getElementById('new-task-code').value;
    // console.log(projectCode);

    // debugger;
    const backlogList = document.getElementById('backlog');
    const todoList = document.getElementById('todo');
    const inProgressList = document.getElementById('inprogress');
    const completedList = document.getElementById('completed');

    // // Clear previous backlog list items
    backlogList.innerHTML = '';
    // // Clear previous todo list items
    todoList.innerHTML = '';
    // // Clear previous in progress list items
    inProgressList.innerHTML = '';
    // // Clear previous completed list items
    completedList.innerHTML = '';

    try {
        // const backlogQuerySnapshot = await getDocs(collection(db, "backlog"));
        const backlogQuerySnapshot = await getDocs(query(collection(db, "backlog"), where("id", "==", projectCode)));
        // console.log(todoList.children);
        let tempBacklogElms = [];
        backlogQuerySnapshot.forEach((doc) => {
            const taskData = doc.data();
            const taskElement = createTaskElement(taskData, doc.id, "backlog");
            tempBacklogElms.push(taskElement);
        });
        backlogListDataElements = [...tempBacklogElms];

        // const todoQuerySnapshot = await getDocs(collection(db, "todo"));
        const todoQuerySnapshot = await getDocs(query(collection(db, "todo"), where("id", "==", projectCode)));
        // console.log(todoList.children);
        let tempTodoElms = [];
        todoQuerySnapshot.forEach((doc) => {
            const taskData = doc.data();
            const taskElement = createTaskElement(taskData, doc.id, "todo");
            tempTodoElms.push(taskElement);
        });
        todoListDataElements = [...tempTodoElms];


        // const inProgressQuerySnapshot = await getDocs(collection(db, "inprogress"));
        const inProgressQuerySnapshot = await getDocs(query(collection(db, "inprogress"), where("id", "==", projectCode)));
        let tempinProgressElms = [];
        inProgressQuerySnapshot.forEach((doc) => {
            const taskData = doc.data();
            const taskElement = createTaskElement(taskData, doc.id, "inprogress");
            tempinProgressElms.push(taskElement);
            // inProgressList.appendChild(taskElement);
            // console.log(inProgressList);
        });
        inProgressListDataElements = [...tempinProgressElms];


        // const completedQuerySnapshot = await getDocs(collection(db, "completed"));
        const completedQuerySnapshot = await getDocs(query(collection(db, "completed"), where("id", "==", projectCode)));
        let tempCompletedElms = [];
        completedQuerySnapshot.forEach((doc) => {
            const taskData = doc.data();
            const taskElement = createTaskElement(taskData, doc.id, "completed");
            tempCompletedElms.push(taskElement);
        });
        completedListDataElements = [...tempCompletedElms];


        setTodoListElementsList();

        // Add event listeners to all tasks after elements are added
        addEventListenersToTasks();
    } catch (error) {
        console.error("Error querying collections: ", error);
    }
}

// Function to add drag listeners to all tasks
function addDragListenersToTasks() {
    const tasks = document.querySelectorAll('.task');
    tasks.forEach(task => {
        addDragListeners(task);
    });
}

// Function to add delete listeners to all tasks
function addDeleteListenersToTasks() {
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(deleteButton => {
        const docId = deleteButton.dataset.docid;
        const collectionName = deleteButton.closest('.list-group').id;
        addDeleteListener(deleteButton, docId, collectionName);
    });
}

// displayTodoList();

// --------------------------------------------------

const BACKLOG_COLLECTION = 'backlog';
const TODO_COLLECTION = 'todo';
const IN_PROGRESS_COLLECTION = 'inprogress';
const COMPLETED_COLLECTION = 'completed';

// Function to handle drag start event
function handleDragStart(event) {
    draggingTask = event.target;
    draggingTask.classList.add('dragging');
}

// Function to handle drag end event
function handleDragEnd() {
    draggingTask.classList.remove('dragging');
    draggingTask = null;
}

// Function to handle drag over event
function handleDragOver(event) {
    event.preventDefault();
    const afterElement = getDragAfterElement(event.currentTarget, event.clientY);
    const container = afterElement ? afterElement.parentElement : event.currentTarget;
    container.insertBefore(draggingTask, afterElement);
}


async function handleDrop(event, targetCollection) {
    const taskId = event.dataTransfer.getData('taskId');
    const sourceCollection = event.dataTransfer.getData('sourceCollection');

    if (!sourceCollection || !taskId) {
        console.error("Source collection or task ID is empty or undefined.");
        return;
    }

    try {
        // Construct the document reference for the task
        const taskDocRef = doc(db, sourceCollection, taskId);

        // Get the task document from Firestore
        const taskDocSnap = await getDoc(taskDocRef);

        if (!taskDocSnap.exists()) {
            console.error("Task document does not exist.");
            return;
        }

        const taskData = taskDocSnap.data();

        // Delete the task from the source collection
        await deleteDoc(doc(db, sourceCollection, taskId));

        // Add the task to the target collection
        await addDoc(collection(db, targetCollection), {
            task: taskData.task,
            priority: taskData.priority,
            id: taskData.id,
            count: taskData.count
        });

        // Refresh the display of the todo list
        displayTodoList();
    } catch (error) {
        console.error("Error moving task: ", error);
    }
}

// Function to get priority icon class based on priority
function getPriorityIconClass(priority) {
    switch (priority) {
        case 'high':
            return 'bi-arrow-up-circle-fill';
        case 'medium':
            return 'bi-dash-circle-fill';
        case 'low':
            return 'bi-arrow-down-circle-fill';
        default:
            return 'bi-dash-circle-fill';
    }
}

// Add event listener to the delete button
document.addEventListener('click', async event => {
    if (event.target.classList.contains('delete-btn')) {
        const docId = event.target.dataset.docid;
        // await console.log(docId);
        // await console.log(event.target.dataset);
        // await console.log(event.target);
        document.getElementById('todo').innerHTML = '';
        // console.log(document.getElementById('todo'));

        const collectionName = event.target.closest('.list-group').id;
        try {
            await deleteDoc(doc(db, collectionName, docId));
            await displayTodoList();
        } catch (error) {
            console.error("Error deleting task: ", error);
        }
    }
});

// Add event listeners to list groups to handle drop events
document.querySelectorAll('.list-group').forEach(listGroup => {
    listGroup.addEventListener('dragover', event => event.preventDefault());
    listGroup.addEventListener('drop', event => {
        const targetCollection = event.currentTarget.id;
        handleDrop(event, targetCollection);
    });
});


// Reference to the select element
const newTaskCodeSelect = document.getElementById('new-task-code');

// Function to fetch document IDs from Firestore
async function fetchProjectDocumentIds() {
    try {
        const projectQuerySnapshot = await getDocs(collection(db, 'projects'));
        const documentIds = projectQuerySnapshot.docs.map(doc => doc.id);
        return documentIds;
    } catch (error) {
        console.error('Error fetching project document IDs:', error);
        return [];
    }
}

// Function to update select options with document IDs
async function updateSelectOptions() {
    const documentIds = await fetchProjectDocumentIds();
    newTaskCodeSelect.innerHTML = ''; // Clear existing options

    documentIds.forEach(docId => {
        const option = document.createElement('option');
        option.value = docId;
        option.textContent = docId;
        newTaskCodeSelect.appendChild(option);
    });
}

// Call the function to update select options
updateSelectOptions();

const newProjectForm = document.getElementById('new-project-form');
const newProjectInput = document.getElementById('new-project-input');
const newTasksForm = document.getElementById('new-tasks-form');
const deleteProject = document.getElementById('deleteProject');

newProjectForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior

    const projectText = newProjectInput.value.trim();

    if (projectText === '') {
        displayTodoList(); // Call displayTodoList if input is empty
    } else {
        try {
            // Add the project to Firestore
            await setDoc(doc(db, 'projects', projectText), {
                id: projectText
            });
            // Clear the input field after adding the project
            confirm("Project added successfully!");
            newProjectInput.value = '';
            updateSelectOptions();
        } catch (error) {
            console.error("Error adding project to Firestore: ", error);
        }
    }
});

newTasksForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior
    displayTodoList();
});

const deleteProjectBtn = document.getElementById('deleteProject');
const confirmDeleteBtn = document.getElementById('confirmDelete');

deleteProjectBtn.addEventListener('click', async (e) => {
    // Show the custom confirmation modal
    const confirmationModal = new bootstrap.Modal(document.getElementById('myModal'));
    confirmationModal.show();

    confirmDeleteBtn.addEventListener('click', async () => {
        const projectId = document.getElementById('new-task-code').value;
        try {
            await deleteDoc(doc(db, 'projects', projectId));
            const backlogSnapshot = await getDocs(query(collection(db, 'backlog'), where('id', '==', projectId)));
            const backlogBatch = writeBatch(db);
            backlogSnapshot.forEach((doc) => {
                backlogBatch.delete(doc.ref);
            });
            await backlogBatch.commit();

            const todoSnapshot = await getDocs(query(collection(db, 'todo'), where('id', '==', projectId)));
            const todoBatch = writeBatch(db);
            todoSnapshot.forEach((doc) => {
                todoBatch.delete(doc.ref);
            });
            await todoBatch.commit();

            const inprogressSnapshot = await getDocs(query(collection(db, 'inprogress'), where('id', '==', projectId)));
            const inprogressBatch = writeBatch(db);
            inprogressSnapshot.forEach((doc) => {
                inprogressBatch.delete(doc.ref);
            });
            await inprogressBatch.commit();

            const completedSnapshot = await getDocs(query(collection(db, 'completed'), where('id', '==', projectId)));
            const completedBatch = writeBatch(db);
            completedSnapshot.forEach((doc) => {
                completedBatch.delete(doc.ref);
            });
            await completedBatch.commit();

            await updateSelectOptions();
            displayTodoList();
        } catch (error) {
            console.error('Error deleting project:', error);
        }
        // Hide the modal after confirmation
        confirmationModal.hide();
    });
});

// Call displayTodoList initially
displayTodoList();