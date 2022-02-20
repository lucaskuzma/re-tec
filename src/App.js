import './App.css';
import { Component } from 'react';
import Neuron from './Neuron'

class App extends Component {
  constructor(props) {
    super(props)
    let value = 'a - b 51, dog 3\nb - dog 2\nc - a 5\ndog - c 3'
    this.state = {
      ...App.updateResult(value),
      status: 'ok',
      time: 0,
    };

    this.handleChange = this.handleChange.bind(this);
    this.tick = this.tick.bind(this);
  }

  componentDidMount() {
    this.timer = setInterval(this.tick, 1000)
  }

  componentWillUnmount() {
    clearInterval(this.timer)
  }

  tick() {
    this.setState({time: this.state.time + 1})
    this.setState({status: this.state.time})
  }

  handleChange(event) {
    this.setState(
      App.updateResult(event.target.value)
    )
  }

  static parse(line) {
    let neuron = {}
    const regex = /(\w+)\s*-\s*(.*)/
    const match = regex.exec(line);
    if (match) {
      neuron.name = match[1]
      neuron.connections = []
      let connections = match[2]      
      for (const connectionString of connections.split(',')) {
        const trimmed = connectionString.trim()
        const regex = /(\w+)\s*(\d+)/
        const match = regex.exec(connectionString)
        const connection = {}
        connection.destination = match[1]
        connection.length = match[2]
        neuron.connections.push(connection) 
      }
    }
    return neuron
  }

  static describe(neuron) {
    let connectionString = ''
    for (const connection of neuron.connections) {
      connectionString += `[${connection.destination} ↻ ${connection.length}] `
    }
    const out = `${neuron.name} ➤ ${connectionString}\n`
    return out
  }

  static updateResult(text) {
    let lineCount = 1; // rough estimate of lines

    // split input into lines
    let lines = text.split('\n');

    // init
    let neurons = []
    let output = ''

    // for each line
    for (const line of lines) {
      lineCount += 1 + Math.floor(line.length / 38);

      // parse string into neuron
      const neuron = this.parse(line)
      neurons.push(neuron)

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
              type="text"
              value={this.state.value}
              onScroll={this.handleScroll}
              onChange={this.handleChange}
            />
            <textarea
              className="App-outputArea App-textArea"
              rows={this.state.rows}
              type="text"
              value={this.state.output}
              onScroll={this.handleScroll}
              readOnly
            />
          </form>
          <form>
          <textarea
              className="App-statusArea App-textArea"
              rows={8}
              type="text"
              value={this.state.status}
              readOnly
            />
          </form>
        </div>

        <div className='App-neuronArea'>
          {this.state.neurons.map(neuron => <Neuron key={neuron.name} neuron={neuron}/>)}
        </div>
      </div>
    )
  }
}

export default App
