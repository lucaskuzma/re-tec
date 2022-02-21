import './App.css';
import { Component } from 'react';
import NeuronComponent from './NeuronComponent'
import * as Tone from 'tone'

type Signal = {
  progress: number
  key: number
}

type Connection = {
  destination: string
  length: number
  signals: Array<Signal>,
}

type Neuron = {
  name: string
  threshold: number
  activation: number
  firing: boolean
  connections: Array<Connection>
}

type State = {
  stimulus: string,
  status: string,
  time: number,
  rows: number,
  value: string,
  output: string,
  neurons: Map<string, Neuron>,
}

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
  }
  synth: Tone.PolySynth

  constructor(props) {
    super(props)
    this.synth = new Tone.PolySynth().toDestination()
    let value = 'a 3 - b 9, e 2\nb 3 - e 24, f 4\nc 5 - a 7, d 3, f 17\nd 2 - a 2, c 1\ne 6 - c 3, g 29\nf 3 - c 5\ng 5 - b 5 c 8'
    this.state = {
      ...App.parseInput(value),
      stimulus: 'a b c a b c . . a . . . a',
      status: 'ok',
      time: 0,
    }

    this.handleChange = this.handleChange.bind(this);
    this.handleStimulusChange = this.handleStimulusChange.bind(this);
    this.tick = this.tick.bind(this);
  }

  componentDidMount() {
    this.timer = setInterval(this.tick, 250)
    
    // let sensor = this.state.neurons.get('a')
    // sensor.activation = sensor.threshold

    // fire each neuron once
    // this.state.neurons.forEach(neuron => {
    //   neuron.activation = neuron.threshold + 1
    // })
  }

  componentWillUnmount() {
    clearInterval(this.timer)
  }

  tick() {
    this.setState({time: this.state.time + 1})
    this.setState({status: this.state.time})

    // make `a` an autostimulated "sensor"
    // let sensor = this.state.neurons.get('a')
    // let sensor = this.state.neurons.get('g')
    // let sensor = this.state.neurons.get('abcdefg'.charAt(Math.random() * 7))
    // let sensor = this.state.neurons.get('abcdefg'.charAt(this.state.time % 7))
    const stimuli = this.state.stimulus.split(' ')
    let sensor = this.state.neurons.get(stimuli[this.state.time % stimuli.length])
    if (sensor)
      sensor.activation++

    this.state.neurons.forEach(neuron => {
      if (neuron.activation > neuron.threshold) {
        // if threshold reached, fire
        neuron.firing = true
        neuron.activation = 0
        neuron.connections.forEach(connection => {
          // add signal to connection
          connection.signals.push({
            progress: 0,
            key: Math.random(),
          })
        })
        const note = neuron.name + '3'
        this.synth.triggerAttackRelease(note, '2n');
      } else {
        // otherwise stop firing
        neuron.firing = false
      }

      neuron.connections.forEach(connection => {
        connection.signals.forEach(signal => {
          signal.progress++
          if (signal.progress > connection.length) {
            // activate destination
            let destination = this.state.neurons.get(connection.destination)
            destination.activation++
            // flag for deletion
            signal.progress = -1
          }
        })
        connection.signals = connection.signals.filter(signal => signal.progress >= 0)
      })
    })
  }

  handleChange(event) {
    this.setState(
      App.parseInput(event.target.value)
    )
    Tone.start()
  }

  handleStimulusChange(event) {
    this.setState({
      stimulus: event.target.value,
    })
    Tone.start()
  }

  static parse(line: string) : Neuron | undefined {
    let neuron: Neuron | undefined
    const regex = /(\w+)\s+(\d+)\s*-\s*(.*)/
    const match = regex.exec(line);
    if (match) {
      neuron = {
        name: match[1],
        threshold: parseInt(match[2]),
        activation: 0,
        firing: false,
        connections: [] as Connection[],
      }
      neuron.name = match[1]
      neuron.connections = []
      let connections = match[3]      
      for (const connectionString of connections.split(',')) {
        const trimmed = connectionString.trim()
        const regex = /(\w+)\s*(\d+)/
        const match = regex.exec(trimmed)
        const connection = {
          destination: match[1],
          length: parseInt(match[2]),
          signals: [],
        } as Connection
        neuron.connections.push(connection) 
      }
    }
    return neuron
  }

  static describe(neuron: Neuron) {
    let connectionString = ''
    for (const connection of neuron.connections) {
      connectionString += `[${connection.destination} ↻ ${connection.length}] `
    }
    const out = `${neuron.name} ${neuron.threshold} ➤ ${connectionString}\n`
    return out
  }

  static parseInput(text: string) {
    let lineCount = 1; // rough estimate of lines

    // split input into lines
    let lines = text.split('\n');

    // init
    let neurons = new Map<string, Neuron>()
    let output = ''

    // for each line
    for (const line of lines) {
      lineCount += 1 + Math.floor(line.length / 38);

      // parse string into neuron
      let neuron = this.parse(line)
      let existing = neurons.get(neuron.name)
      if (existing) {
        neuron.activation = existing.activation
      }
      neurons.set(neuron.name, neuron)

      // print neuron
      output += this.describe(neuron)
    }

    return {
      value: text,
      output: output,
      rows: lineCount,
      neurons: neurons,
    }
  }

  render() {
    return (
      <div className="App">
        <div className="App-instructions">
          <p>
            {/* <strong><a class="title" href="?e=">re-TEC</a></strong> */}
          </p>
        </div>
        <div className="center">
          <form>
            <textarea
              className="App-entryArea App-textArea"
              rows={this.state.rows}
              // type="text"
              value={this.state.value}
              // onScroll={this.handleScroll}
              onChange={this.handleChange}
            />
            <textarea
              className="App-outputArea App-textArea"
              rows={this.state.rows}
              // type="text"
              value={this.state.output}
              // onScroll={this.handleScroll}
              readOnly
            />
          </form>
          <form>
            <textarea
                className="App-stimulusArea App-textArea"
                rows={4}
                // type="text"
                value={this.state.stimulus}
                onChange={this.handleStimulusChange}
              />
            <textarea
                className="App-statusArea App-textArea"
                rows={4}
                // type="text"
                value={this.state.status}
                readOnly
              />
          </form>
        </div>

        <div className='App-neuronArea'>
          {Array.from(this.state.neurons.values()).map((v, k) => <NeuronComponent key={k} neuron={v}/>)}
        </div>
      </div>
    )
  }
}

export default App
