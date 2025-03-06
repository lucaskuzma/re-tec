import './App.css';
import { Component } from 'react';
import NeuronComponent from './NeuronComponent';
import * as Tone from 'tone';
import { GraphData } from 'react-force-graph-3d';
import React from 'react';
import GraphComponent from './GraphComponent.tsx';

type Signal = {
    progress: number;
    key: number;
};

type Connection = {
    destination: string;
    length: number;
    command: string;
    signals: Array<Signal>;
};

type Neuron = {
    name: string;
    threshold: number;
    activation: number;
    stimulation?: number;
    firing: boolean;
    lastFired?: number;
    connections: Array<Connection>;
};

type ToneRow = {
    notes: Array<string>;
};

type OutputNeuron = Neuron & {
    rows: Array<ToneRow>;
    currentNote: number;
    currentRow: number;
    currentDuration: string;
};

type State = {
    stimulus: string;
    status: string;
    time: number;
    rows: number;
    value: string;
    output: string;
    neurons: Map<string, Neuron>;
    graph: GraphData;
};

type Command = {
    note: string | null; // null means no change
    row: string | null; // null means no change
    duration: string | null; // null means no change
};

class App extends Component {
    timer: NodeJS.Timer;
    state: State = {
        stimulus: '',
        status: '',
        time: 0,
        rows: 0,
        value: '',
        output: '',
        neurons: new Map<string, Neuron>(),
        graph: { nodes: [], links: [] },
    };
    synth: Tone.PolySynth;

    constructor(props) {
        super(props);
        this.synth = new Tone.PolySynth().toDestination();
        this.synth.set({
            oscillator: {
                type: 'fatsine',
            },
            envelope: {
                decay: 1,
                release: 2,
            },
        });

        // prettier-ignore
        let value = [
            'a 4 12 › b 2 c 8 [n,n]',
            'b 9 › c 2 e 7 [c,n] g 2',
            'c 2 » [e3 e4 e5] [b3 b4 b5]',
            'd 3 › a 3 e 2 [,n] j 12',
            'e 3 » [e4 f4 g#4 a4] [b5 c5 d5 e5] [e2 f3 g#4]',
            'f 5 › d 5 e 2 [n] h 1 [n,c,16n] g 2',
            'g 4 › e 6 [,n] c 4 [n,c,1n]',
            'h 4 » [a2 e2 f3]',
            'i 2 › c 4 [,,16n] h 8 [n,c,8n]',
            'j 3 › f 3 c 3 [n,c,4n]',
        ].join('\n');

        this.state = {
            ...App.parseInput(value),
            stimulus: 'a . . f . . b i i j b g . . . . g d d a .',
            status: 'ok',
            time: 0,
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleStimulusChange = this.handleStimulusChange.bind(this);
        this.tick = this.tick.bind(this);
    }

    componentDidMount() {
        this.timer = setInterval(this.tick, 1000 / 8);
    }

    componentWillUnmount() {
        clearInterval(this.timer);
    }

    tick() {
        this.setState({ time: this.state.time + 1 });
        this.setState({ status: this.state.time % 8 });

        const stimuli = this.state.stimulus.split(' ');
        let stimulatedNeuron = this.state.neurons.get(stimuli[this.state.time % stimuli.length]);
        if (stimulatedNeuron) this.activateNeuron(stimulatedNeuron);

        this.state.neurons.forEach((neuron) => {
            neuron.connections.forEach((connection) => {
                connection.signals.forEach((signal) => {
                    signal.progress++;
                    if (signal.progress > connection.length) {
                        // activate destination
                        let destination = this.state.neurons.get(connection.destination);
                        if (destination) this.activateNeuron(destination, connection.command);
                        // flag for deletion
                        signal.progress = -1;
                    }
                });
                connection.signals = connection.signals.filter((signal) => signal.progress >= 0);
            });
        });
    }

    handleChange(event) {
        this.setState(App.parseInput(event.target.value));
        Tone.start();
    }

    handleStimulusChange(event) {
        this.setState({
            stimulus: event.target.value,
        });
        Tone.start();
    }

    static createNeuron(name: string, threshold: string, stimulation?: string): Neuron {
        return {
            name: name,
            threshold: parseInt(threshold),
            activation: 0,
            stimulation: stimulation ? parseInt(stimulation) : undefined,
            firing: false,
            connections: [],
        };
    }

    static parseConnections(connectionString: string): Connection[] {
        const connections: Connection[] = [];
        let connectionTokens = connectionString.trim().split(' ');
        while (connectionTokens.length > 1) {
            let destination = connectionTokens.shift();
            let length = connectionTokens.shift();
            let command = '';

            // check if next token is a command in brackets
            if (connectionTokens.length > 0 && connectionTokens[0].startsWith('[')) {
                command = connectionTokens.shift()!.slice(1, -1); // Remove brackets
            }

            const connection = {
                destination: destination!,
                length: length ? parseInt(length) : 0,
                command: command,
                signals: [],
            } as Connection;
            connections.push(connection);
        }
        return connections;
    }

    static parseToneRows(toneString: string): ToneRow[] {
        const rows: ToneRow[] = [];
        const rowMatches = toneString.match(/\[(.*?)\]/g) || [];

        for (const match of rowMatches) {
            // Remove brackets and split by spaces
            const notes = match.slice(1, -1).split(' ');
            rows.push({ notes });
        }

        return rows;
    }

    static createOutputNeuron(name: string, threshold: string, stimulation?: string, toneString?: string): OutputNeuron {
        // Start with base neuron
        const baseNeuron = App.createNeuron(name, threshold, stimulation);

        // Add output-specific properties
        return {
            ...baseNeuron,
            rows: toneString ? App.parseToneRows(toneString) : [],
            currentNote: 0,
            currentRow: 0,
            currentDuration: '1n',
        };
    }

    static parse(line: string): Neuron | undefined {
        // regular neurons: "name threshold [stimulation] › dest1 len1 dest2 len2"
        const regularNeuronRegex = /\w+\s\d+(\s\d*)*\s›(\s\w+\s\d+)+/;

        // output neurons: "name threshold [stimulation] » [note1 note2] [note3 note4]"
        const outputNeuronRegex = /\w+\s\d+(\s\d*)*\s»\s*(\[[\w#\d\s]+\])*\s*/;

        if (outputNeuronRegex.test(line)) {
            // output neuron
            let [neuronString, toneString] = line.split('»');
            if (neuronString) {
                let [name, threshold, stimulation] = neuronString.split(' ');
                let neuron = App.createOutputNeuron(name, threshold, stimulation, toneString);
                return neuron;
            }
        } else if (regularNeuronRegex.test(line)) {
            // regular neuron
            let [neuronString, connectionString] = line.split('›');
            if (neuronString) {
                let [name, threshold, stimulation] = neuronString.split(' ');
                let neuron = App.createNeuron(name, threshold, stimulation);
                neuron.connections = App.parseConnections(connectionString);
                return neuron;
            }
        } else return undefined;
    }

    static describe(neuron: Neuron) {
        let connectionString = '';
        for (const connection of neuron.connections) {
            connectionString += `[${connection.destination} ⟿ ${connection.length}] `;
        }
        const out = `${neuron.name} ${neuron.threshold} ➤ ${connectionString}\n`;
        return out;
    }

    static parseInput(text: string) {
        let lineCount = 1; // rough estimate of lines

        // split input into lines
        let lines = text.split('\n');

        // init
        let neurons = new Map<string, Neuron>();
        let output = '';

        // for each line
        for (const line of lines) {
            lineCount += 1 + Math.floor(line.length / 38);

            // parse string into neuron
            let neuron = this.parse(line);
            if (neuron) {
                let existing = neurons.get(neuron.name);
                if (existing) {
                    neuron.activation = existing.activation;
                }
                neurons.set(neuron.name, neuron);

                // print neuron
                output += this.describe(neuron);
            }
        }

        let graph: GraphData = {
            nodes: [],
            links: [],
        };

        neurons.forEach((neuron) => {
            graph.nodes.push({
                id: neuron.name,
                name: neuron.name,
                val: neuron.activation,
            });

            neuron.connections.forEach((connection) => {
                if (neurons.has(connection.destination)) {
                    graph.links.push({
                        source: neuron.name,
                        target: connection.destination,
                    });
                }
            });
        });

        return {
            value: text,
            output: output,
            rows: lineCount,
            neurons: neurons,
            graph: graph,
        };
    }

    static isOutputNeuron(neuron: Neuron): neuron is OutputNeuron {
        return 'rows' in neuron && 'currentNote' in neuron;
    }

    static parseCommand(commandStr: string): Command {
        const parts = commandStr.trim().split(',');
        return {
            note: parts[0] ? parts[0].trim() : null,
            row: parts[1] ? parts[1].trim() : null,
            duration: parts[2] ? parts[2].trim() : null,
        };
    }

    private handleOutputCommand(outputNeuron: OutputNeuron, command: string) {
        const parsed = App.parseCommand(command);

        // Handle row changes
        if (parsed.row !== null) {
            if (parsed.row === 'n') {
                outputNeuron.currentRow = (outputNeuron.currentRow + 1) % outputNeuron.rows.length;
            } else if (parsed.row === 'p') {
                outputNeuron.currentRow = (outputNeuron.currentRow - 1 + outputNeuron.rows.length) % outputNeuron.rows.length;
            } else {
                const rowNum = parseInt(parsed.row);
                if (!isNaN(rowNum)) {
                    outputNeuron.currentRow = rowNum % outputNeuron.rows.length;
                }
            }
        }

        // Handle note changes without playing
        if (parsed.note !== null) {
            const currentRowLength = outputNeuron.rows[outputNeuron.currentRow].notes.length;

            switch (parsed.note) {
                case 'n':
                    outputNeuron.currentNote = (outputNeuron.currentNote + 1) % currentRowLength;
                    break;
                case 'p':
                    outputNeuron.currentNote = (outputNeuron.currentNote - 1 + currentRowLength) % currentRowLength;
                    break;
                case 'c':
                    // Do nothing - note will play when neuron fires
                    break;
                default:
                    const noteNum = parseInt(parsed.note);
                    if (!isNaN(noteNum)) {
                        outputNeuron.currentNote = noteNum % currentRowLength;
                    }
            }
        }

        // Handle duration changes
        if (parsed.duration !== null) {
            outputNeuron.currentDuration = parsed.duration;
        }
    }

    private playCurrentNote(outputNeuron: OutputNeuron) {
        const note = outputNeuron.rows[outputNeuron.currentRow].notes[outputNeuron.currentNote];
        const regex = /\d+$/;
        if (regex.test(note)) {
            this.synth.triggerAttackRelease(note, outputNeuron.currentDuration, undefined, 0.1);
        }
    }

    private activateNeuron(neuron: Neuron, command?: string) {
        // handle commands immediately when neuron is activated
        if (App.isOutputNeuron(neuron) && command) {
            this.handleOutputCommand(neuron, command);
        }

        neuron.activation++;

        if (neuron.stimulation && neuron.stimulation > 0) {
            neuron.activation += 1 / neuron.stimulation;
        }

        if (neuron.activation >= neuron.threshold) {
            // if threshold reached, fire
            neuron.firing = true;
            neuron.activation = 0;
            neuron.lastFired = Date.now();

            // output neurons emit notes only when firing
            if (App.isOutputNeuron(neuron)) {
                this.playCurrentNote(neuron);
            } else {
                // regular neurons just pass signals
                neuron.connections.forEach((connection) => {
                    connection.signals.push({
                        progress: 0,
                        key: Math.random(),
                    });
                });
            }
        } else {
            // otherwise stop firing
            neuron.firing = false;
        }
    }

    render() {
        return (
            <div className='App'>
                <div className='App-controlColumn'>
                    <div>
                        <textarea className='App-entryArea App-textArea' rows={this.state.rows} value={this.state.value} onChange={this.handleChange} />
                    </div>
                    {/* <div className='App-control-description'>
                        <p>
                            Define nodes like this: [name] [threshold]
                            [self-stimulation-period] &gt; [destination]
                            [length]
                        </p>
                        <p>Note names will emit sounds.</p>
                        <p>
                            For more stimulation, use the form below to enter
                            node names.
                        </p>
                    </div> */}
                    <div>
                        <textarea className='App-stimulusArea App-textArea' rows={4} value={this.state.stimulus} onChange={this.handleStimulusChange} />
                        <textarea className='App-statusArea App-textArea' rows={4} value={this.state.status} readOnly />
                    </div>
                </div>

                <div className='App-neuronColumn'>
                    <div className='App-neuronStack'>
                        {Array.from(this.state.neurons.values()).map((v, k) => (
                            <NeuronComponent key={k} neuron={v} isOutput={App.isOutputNeuron(v)} />
                        ))}
                    </div>
                </div>

                <div className='App-graphColumn'>
                    <GraphComponent graph={this.state.graph} neurons={this.state.neurons} />
                    {/* <textarea
                        className='App-outputArea App-textArea'
                        rows={this.state.rows}
                        value={this.state.output}
                        readOnly
                    /> */}
                </div>
            </div>
        );
    }
}

export { Neuron, App as default };
