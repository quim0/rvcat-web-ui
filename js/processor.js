/* SAMPLE

digraph {
    edge [headport="w"]
    rankdir="LR";
    Fetch:e1 -> Dispatch:w1;
    Fetch:e2 -> Dispatch:w2;
    Fetch:e3 -> Dispatch:w3;
    Fetch:e4 -> Dispatch:w4;

    Dispatch:e1 -> P0;
    Dispatch:e2 -> P1;
    Dispatch:e3 -> P2;
    Dispatch:e4 -> P3;

     subgraph cluster_0 {
        rankdir="LR";
        node [shape=box3d];
        P0 [shape=box3d,height=0.15];
        P1 [shape=box3d,height=0.15];
        P2 [shape=box3d,height=0.15];
        P3 [shape=box3d,height=0.15];

        label = "Execute";
    }

    P0:e -> WriteBack:w1;
    P1:e -> WriteBack:w2;
    P2:e -> WriteBack:w3;
    P3:e -> WriteBack:w4;

    WriteBack:e1 -> Retire:w1;
    WriteBack:e2 -> Retire:w2;
    WriteBack:e3 -> Retire:w3;
    WriteBack:e4 -> Retire:w4;

    Retire:e1 -> Ret:w1;
    Retire:e2 -> Ret:w2;
    Retire:e3 -> Ret:w3;
    Retire:e4 -> Ret:w4;
    Retire:e5 -> Ret:w5;
    Retire:e6 -> Ret:w6;
    Retire:e6 -> Ret:w6;
    Retire:e6 -> Ret:w6;

    WriteBack[shape=box,height=1.5,width=1.5,label="Write Back"]
    Dispatch[shape=box,height=1.5,width=1.5]
    Retire[shape=box,height=1.5,width=1.5]

    Fetch[style=invis,shape=box,height=1]

    Ret[style=invis,shape=box,height=1.5]
}


*/

const PROCESSOR_GRAPH_PREAMBLE = `digraph {
    edge [headport="w"]
    rankdir="LR";
`

function construct_processor_dot(dispatch_width, num_ports, retire_width) {
    let dot_code = PROCESSOR_GRAPH_PREAMBLE;

    // --- DISPATCH ---
    dot_code += `
    Fetch[style=invis,shape=box,height=1]
    Dispatch[shape=box,height=1.5,width=1.5,label="Dispatch\nw=${dispatch_width}"]
    `
    for (let i = 0; i < dispatch_width; i++) {
        dot_code += `Fetch:e${i} -> Dispatch:w${i}\n`
    }

    // --- EXECUTE ---
    dot_code += `subgraph cluster_execute {
        rankdir="LR";
    `
    for (let i = 0; i < num_ports; i++) {
        dot_code += `P${i} [shape=box3d,height=0.15];\n`
    }

    dot_code += `label = "Execute";
    }\n`

    for (let i=0; i<num_ports; i++) {
        dot_code += `Dispatch:e${i} -> P${i}\n`
    }

    // --- WRITEBACK ---
    dot_code += `
    WriteBack[shape=box,height=1.5,width=1.5,label="Write Back\nw=${num_ports}"]
    `
    for (let i = 0; i < num_ports; i++) {
        dot_code += `P${i}:e -> WriteBack:w${i}\n`
    }

    // --- RETIRE ---
    dot_code += `
    Retire[shape=box,height=1.5,width=1.5,label="Retire\nw=${retire_width}"]
    Ret[style=invis,shape=box,height=1.5]
    `
    for (let i = 0; i < num_ports; i++) {
        dot_code += `WriteBack:e${i} -> Retire:w${i}\n`
    }
    for (let i = 0; i < retire_width; i++) {
        dot_code += `Retire:e${i} -> Ret:w${i}\n`
    }

    return dot_code + `}`
}