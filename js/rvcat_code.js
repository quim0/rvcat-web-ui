const GET_AVAIL_PROGRAMS = `import rvcat
rvcat._program.list_programs_json()
`

const GET_AVAIL_PROCESSORS = `import rvcat
rvcat._processor.list_processors_json()
`

// SHOW program
const PROG_SHOW              = 'str(rvcat._program)'
const PROG_SHOW_DEPENDENCIES = `rvcat._program.show_dependencies()`
const PROG_SHOW_DEPENDENCIES_GRAPHVIZ = `rvcat._program.get_dependencies_grapviz(num_iters=3)`
const PROG_SHOW_CRITICAL_PATHS_GRAPHVIZ = `rvcat._program.get_recurrent_paths_graphviz()`
const PROG_SHOW_ANNOTATED    = `rvcat._program.annotate_action()`
const PROG_SHOW_EXECUTION    = `rvcat._program.annotate_execution()`
const PROG_SHOW_MEMORY       = `rvcat._program.show_memory_trace()`
const PROG_SHOW_STATIC_PERFORMANCE = `rvcat._program.show_static_performance_analysis()`

// SHOW processor
const SHOW_PROCESSOR = 'rvcat._processor.json()'

// SHOW isa
const SHOW_ISA = 'str(rvcat._isa)'

// RUN program
const RUN_PROGRAM_PREAMBLE = function() {
    let res = `rvcat._scheduler.load_program(rvcat._program, iterations=${currentIterations()}, window_size=${currentROBSize()})\n`
    return res;
}
const RUN_PROGRAM_TIMELINE = 'rvcat._scheduler.format_timeline()'
const RUN_PROGRAM_ANALYSIS = 'rvcat._scheduler.format_analysis()'
const RUN_PROGRAM_MEMTRACE = 'rvcat._scheduler.format_memtrace()'

const RVCAT_HEADER = function() {
    let proc = currentProcessor();
    let prog = currentProgram();
    let res = `import rvcat\n`;
    if (proc !== undefined) {
        res += `rvcat._processor.load_processor('${currentProcessor()}')\n`
    }
    if (prog !== undefined) {
    res += `rvcat._program.load_program('${currentProgram()}')\n`
    }
    return res;
}