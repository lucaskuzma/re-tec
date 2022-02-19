import './App.css';
import { Component } from 'react';
class App extends Component {
  constructor(props) {
    super(props)
    let value = 'a - b 51, dog 3\nb - dog 2\nc - a 5\ndog - c 3'
    this.state = {
      ...App.updateResult(value),
      status: 'ok',
    };

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    this.setState(
      App.updateResult(event.target.value)
    )
  }

  static parse(line) {
    let node = {}
    const regex = /(\w+)\s*-\s*(.*)/
    const match = regex.exec(line);
    if (match) {
      node.name = match[1]
      node.connections = []
      let connections = match[2]      
      for (const connectionString of connections.split(',')) {
        const trimmed = connectionString.trim()
        const regex = /(\w+)\s*(\d+)/
        const match = regex.exec(connectionString)
        const connection = {}
        connection.destination = match[1]
        connection.length = match[2]
        node.connections.push(connection) 
      }
    }
    return node
  }

  static describe(node) {
    let connectionString = ''
    for (const connection of node.connections) {
      connectionString += `[${connection.destination} ↻ ${connection.length}] `
    }
    const out = `${node.name} ➤ ${connectionString}\n`
    return out
  }

  static updateResult(text) {
    let lineCount = 1; // rough estimate of lines

    // split input into lines
    let lines = text.split('\n');

    // for each line
    let output = ''
    for (const line of lines) {
      lineCount += 1 + Math.floor(line.length / 38);

      // parse string into node
      const node = this.parse(line)

      // print node
      output += this.describe(node)
    }

    return {
      value: text,
      output: output,
      rows: lineCount,
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
              ref="entry"
              className="App-entryArea App-textArea"
              rows={this.state.rows}
              type="text"
              value={this.state.value}
              onScroll={this.handleScroll}
              onChange={this.handleChange}
            />
            <textarea
              ref="output"
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
              ref="status"
              className="App-statusArea App-textArea"
              rows={8}
              type="text"
              value={this.state.status}
              readOnly
            />
          </form>
        </div>
      </div>
    )
  }
}

export default App;
