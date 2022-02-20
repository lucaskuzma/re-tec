import './App.css';
import { Component } from 'react';
import NeuronComponent from './NeuronComponent'

type Connection = {
  destination: string
  length: number
  progress: number
}

type Neuron = {
  name: string
  threshold: number
  activation: number
  firing: boolean
  connections: Array<Connection>
}

type State = {
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
    status: '',
    time: 0,
    rows: 0,
    value: '',
    output: '',
    neurons: new Map<string, Neuron>(),
  }

  constructor(props) {
    super(props)
    let value = 'a 7 - b 9, d 3\nb 3 - d 2\nc 5 - a 5\nd 8 - c 3'
    this.state = {
      ...App.parseInput(value),
      status: 'ok',
      time: 0,
    }

    this.handleChange = this.handleChange.bind(this);
    this.tick = this.tick.bind(this);
  }

  componentDidMount() {
    this.timer = setInterval(this.tick, 250)
  }

  componentWillUnmount() {
    clearInterval(this.timer)
  }

  tick() {
    this.setState({time: this.state.time + 1})
    this.setState({status: this.state.time})

    // make `a` an autostimulated "sensor"
    let sensor = this.state.neurons.get('a')
    sensor.activation++

    this.state.neurons.forEach(neuron => {
      if (neuron.activation > neuron.threshold) {
        // if threshold reached, fire
        neuron.firing = true
        neuron.activation = 0
        neuron.connections.forEach(connection => {
          // start any unstarted connections
          if (connection.progress == 0) {
            connection.progress = 1
          }
        })
      } else {
        // otherwise stop firing
        neuron.firing = false
      }
      neuron.connections.forEach(connection => {
        if (connection.progress > 0) {
          // progress any started connections
          connection.progress++
        }
        if (connection.progress == connection.length) {
          // if lenfth reached, trigger target
          connection.progress = 0
          let destination = this.state.neurons.get(connection.destination)
          destination.activation++
        }
      })
    })
  }

  handleChange(event) {
    this.setState(
      App.parseInput(event.target.value)
    )
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
        const match = regex.exec(connectionString)
        const connection = {
          destination: match[1],
          length: parseInt(match[2]),
          progress: 0,
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
              className="App-statusArea App-textArea"
              rows={8}
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
