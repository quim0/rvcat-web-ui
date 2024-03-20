// Save the last executed command to be able to re-run it when the selected program change
var lastExecutedCommand = null;

const handlers = {
    'get_programs': (data) => {
        let programs = JSON.parse(data);
        // TODO: Check for errors ?
        for (let program of programs) {
            let option = document.createElement('option');
            option.value = program;
            option.innerHTML = program;
            document.getElementById('programs-list').appendChild(option);
        }
    },
    'get_processors': (data) => {
        let processors = JSON.parse(data);
        // TODO: Check for errors ?
        for (let processor of processors) {
            let option = document.createElement('option');
            option.value = processor;
            option.innerHTML = processor;
            document.getElementById('processors-list').appendChild(option);
        }

        // Once the processors and programs are loaded show the program in the UI
        programShow();
        closeLoadingOverlay();
    },
    'prog_show': (data) => {
        let prog = data;
        prog = prog.replace(/\n/g, '<br>');
        let item = document.getElementById('rvcat-program-show');
        item.innerHTML = prog;
    },
    'print_output': (data) => {
        let out = data.replace(/\n/g, '<br>');
        let item = document.getElementById('rvcat-output');
        item.innerHTML = out;
    }
}

const worker = new Worker('js/worker.js');
worker.onmessage = function(message) {
    console.log('Message received from worker', message);
    if (message.data.action === 'initialized') {
        executeCode(GET_AVAIL_PROGRAMS, 'get_programs');
        executeCode(GET_AVAIL_PROCESSORS, 'get_processors');
    }
    if (message.data.action === 'loadedPackage') {
        // TODO
    }
    if (message.data.action === 'executed') {
        if (message.data.data_type == 'error') {
            // TODO
            return;
        }
        data = message.data.result;
        if (message.data.id !== undefined) {
            if (message.data.id !== undefined) {
                handlers[message.data.id](data);
            } else {
                // TODO: remove
                if (data === undefined) {
                    data = "None";
                }
                data = data.replace(/\n/g, '<br>');
                if (message.data.data_type === 'text') {
                    document.getElementById('execution-result').innerHTML = `
                    <p class="rvcat-result">${data}</p>
                    `
                } else if (message.data.data_type === 'error') {
                    // Replace newlines with <br>
                    document.getElementById('execution-result').innerHTML = `
                    <p class="rvcat-error">${data}</p>
                    `
                }
            }
        }
    }
}

// Get selected values (program, processor... etc)
function currentProgram() {
    let p = document.getElementById('programs-list').value;
    return p;
}

function currentProcessor() {
    let p = document.getElementById('processors-list').value;
    return p;
}

function currentIterations() {
    let i = document.getElementById('num-iters').value;
    return i;
}

function currentROBSize() {
    let rs = document.getElementById('rob-size').value;
    return rs;
}

// Commands
function programShow() {
    executeCode(
        RVCAT_HEADER() + PROG_SHOW,
        'prog_show'
    )

    if (lastExecutedCommand !== null) {
        lastExecutedCommand();
    }
}

function programShowDependencies() {
    executeCode(
        RVCAT_HEADER() + PROG_SHOW_DEPENDENCIES,
        'print_output'
    )
    lastExecutedCommand = programShowDependencies;
}

function programShowExecution() {
    executeCode(
        RVCAT_HEADER() + PROG_SHOW_EXECUTION,
        'print_output'
    )
    lastExecutedCommand = programShowExecution;
}

function programShowMemtrace() {
    executeCode(
        RVCAT_HEADER() + PROG_SHOW_MEMORY,
        'print_output'
    )
    lastExecutedCommand = programShowMemtrace;
}


function programShowAnalysis() {
    executeCode(
        RVCAT_HEADER() + PROG_SHOW_STATIC_PERFORMANCE,
        'print_output'
    )
    lastExecutedCommand = programShowAnalysis;
}

// Pyodide stuff
function initPyodide() {
    openLoadingOverlay();
    worker.postMessage({action: 'initialize'});
}


async function executeCode(code, id=undefined){
    // TODO: Remove
    console.log('Executing code:\n', code);
    worker.postMessage({action: 'execute', code: code, id: id});
}

// UI stuff
function openLoadingOverlay() {
    document.getElementById('loading-overlay').style.display = 'block';
    document.getElementById('blur-overlay-item').style.display = 'block';
}

function closeLoadingOverlay() {
    document.getElementById('loading-overlay').style.display = 'none';
    document.getElementById('blur-overlay-item').style.display = 'none';
}