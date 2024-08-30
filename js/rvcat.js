// Save the last executed command to be able to re-run it when the selected program change
var lastExecutedCommand = null;
var processorInfo = null;

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
        getProcessorInformation();
        closeLoadingOverlay();
    },
    'prog_show': (data) => {
        let prog = data;
        let item = document.getElementById('rvcat-asm-code');
        item.innerHTML = prog;

        if (lastExecutedCommand !== null) {
            lastExecutedCommand();
        }
    },
    'save_processor_info': (data) => {
        let procinfo = JSON.parse(data);
        processorInfo = procinfo;
        showProcessor();
    },
    'generate_dependencies_graph': (data) => {
        let item = document.getElementById('simulation-output');
        item.innerHTML = '';
        // get svg element
        let callback = () => {
            return;
            // Not implement panning of the svg yet
            let item = document.getElementById('simulation-output');
            let svgelem = item.getElementsByTagName('svg')[0];
            // make it zoomable
            let panZoomTiger = svgPanZoom(svgelem);
        }
        createGraphVizGraph(data, item, callback);
        selectButton(document.getElementById('dependencies-output'));

    },
    'generate_critical_paths_graph': (data) => {
        let item = document.getElementById('simulation-output');
        item.innerHTML = '';
        createGraphVizGraph(data, item);
        selectButton(document.getElementById('critical-paths-output'));

    },
    'print_output': (data) => {
        let out = data.replace(/\n/g, '<br>');
        console.log(out);
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
            console.log('Error:', message.data.result);
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
        RVCAT_HEADER() + PROG_SHOW_ANNOTATED,
        'prog_show'
    )

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

function getProcessorInformation() {
    executeCode(
        RVCAT_HEADER() + SHOW_PROCESSOR,
        'save_processor_info'
    )
}

// Pyodide stuff
function initPyodide() {
    setLoadingOverlayMessage('Loading RVCAT');
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

function setLoadingOverlayMessage(message) {
    document.getElementById('loading-overlay-message').innerHTML = message;
}

function selectButton(item) {
    // add tab-item-selected class
    item.classList.add('tab-button-selected');
    // remove tab-item-selected from all siblings
    let siblings = item.parentElement.children;
    for (let s of siblings) {
        if (s !== item) {
            s.classList.remove('tab-button-selected');
        }
    }
}

function reloadRvcat() {
    programShow();
    getProcessorInformation();
}

function createGraphVizGraph(dotCode, targetElement, callback=null) {
        // Create an instance of Viz.js
        const viz = new Viz();

        // Render the graph
        viz.renderSVGElement(dotCode)
            .then(function(element) {
                // Append the SVG element to the container
                // Remove any existing SVG elements
                targetElement.innerHTML = '';
                targetElement.appendChild(element);
                if (callback !== null) {
                    callback();
                }
            })
            .catch(error => {
                // Handle any errors
                console.error("Error rendering graph:", error);
            });
}

function createProcessorGraph(dispatch, execute, retire) {
    // Define your Graphviz DOT code
    const dotCode = construct_processor_dot(dispatch, execute, retire);
    createGraphVizGraph(dotCode, document.getElementById('pipeline-graph'));
}

function showProcessor() {
    if (processorInfo === null) {
        return;
    }

    /*
    {"name": "Baseline-2", "stages": {"dispatch": 6, "execute": 6, "retire": 8},
    "resources": {"INT": 1, "FLOAT": 2, "FLOAT.SP.MUL": 4, "FLOAT.DP.MUL": 4,
    "FLOAT.SP.FUSED": 5, "FLOAT.DP.FUSED": 5, "BRANCH": 1, "MEM.STORE": 2,
    "MEM.LOAD": 4}, "ports": {"1": ["INT", "BRANCH", "FLOAT"], "2": ["MEM.LOAD",
    "MEM.STORE"], "3": ["FLOAT", "INT"], "4": ["FLOAT", "INT"], "5":
    ["MEM.LOAD", "MEM.STORE"]}, "rports": {"INT": ["1", "3", "4"], "BRANCH":
    ["1"], "FLOAT": ["1", "3", "4"], "MEM.LOAD": ["2", "5"], "MEM.STORE": ["2",
    "5"]}, "cache": null, "nBlocks": 0, "blkSize": 8, "mPenalty": 16,
    "mIssueTime": 8}
    */

    let tableobj = document.getElementById('processor-info-table-body');
    tableobj.innerHTML = '';
    let idx=0
    for (let [key, value] of Object.entries(processorInfo.ports)) {
        let tr = document.createElement('tr');
        let td1 = document.createElement('td');
        td1.innerHTML = "P" + idx;
        tr.appendChild(td1);
        let td2 = document.createElement('td');
        td2.innerHTML = value.join(', ');
        tr.appendChild(td2);
        tableobj.appendChild(tr);
        idx++;
    }

    let dispatch_width = processorInfo.stages.dispatch;
    let num_ports = Object.keys(processorInfo.ports).length;
    let retire_width = processorInfo.stages.retire;
    createProcessorGraph(dispatch_width, num_ports, retire_width);
}

function showDependenciesGraph() {
    executeCode(
        RVCAT_HEADER() + PROG_SHOW_DEPENDENCIES_GRAPHVIZ,
        'generate_dependencies_graph'
    )
    lastExecutedCommand = showDependenciesGraph;
}

function showCriticalPathsGraph() {
    executeCode(
        RVCAT_HEADER() + PROG_SHOW_CRITICAL_PATHS_GRAPHVIZ,
        'generate_critical_paths_graph'
    )
    lastExecutedCommand = showCriticalPathsGraph;
}