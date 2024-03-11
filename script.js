// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

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

const columns = document.querySelectorAll('.col-4');

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

    const todoList = document.getElementById('todo');
    todoList.appendChild(newTask);

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

    // Add the task to Firestore
    try {
        await addDoc(collection(db, "todo"), {
            task: taskText,
            priority: taskPriority
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
        await console.log(docId);
        await console.log(event.target.dataset);
        await console.log(event.target);
        document.getElementById('todo').innerHTML = '';
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
    <span class="badge ${badgeColorClass} rounded-pill mr-2">${priorityIcon}</span>
    <button class="btn btn-outline-danger delete-btn" data-docid="${docId}"><i class="bi bi-trash-fill"></i></button>
</div>
`;

    const deleteButton = taskElement.querySelector('.delete-btn');
    addDeleteListener(deleteButton, docId, collectionName);

    return taskElement;
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

var todoListDataElements = [];
var inProgressListDataElements = [];
var completedListDataElements = [];

function setTodoListElementsList() {
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
    // debugger;
    const todoList = document.getElementById('todo');
    const inProgressList = document.getElementById('inprogress');
    const completedList = document.getElementById('completed');

    // // Clear previous todo list items
    todoList.innerHTML = '';
    // // Clear previous in progress list items
    inProgressList.innerHTML = '';
    // // Clear previous completed list items
    completedList.innerHTML = '';

    try {
        const todoQuerySnapshot = await getDocs(collection(db, "todo"));
        // console.log(todoList.children);
        let tempTodoElms = [];
        todoQuerySnapshot.forEach((doc) => {
            const taskData = doc.data();
            const taskElement = createTaskElement(taskData, doc.id, "todo");
            tempTodoElms.push(taskElement);
        });
        todoListDataElements = [...tempTodoElms];


        const inProgressQuerySnapshot = await getDocs(collection(db, "inprogress"));
        let tempinProgressElms = [];
        inProgressQuerySnapshot.forEach((doc) => {
            const taskData = doc.data();
            const taskElement = createTaskElement(taskData, doc.id, "inprogress");
            tempinProgressElms.push(taskElement);
            // inProgressList.appendChild(taskElement);
            // console.log(inProgressList);
        });
        inProgressListDataElements = [...tempinProgressElms];


        const completedQuerySnapshot = await getDocs(collection(db, "completed"));
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
            priority: taskData.priority
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
        await console.log(docId);
        await console.log(event.target.dataset);
        await console.log(event.target);
        document.getElementById('todo').innerHTML = '';
        console.log(document.getElementById('todo'));

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

// Call displayTodoList initially
displayTodoList();

