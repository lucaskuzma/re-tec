import './App.css';
import { Component } from 'react';
class App extends Component {
  constructor(props) {
    super(props)
    let value = 'a - b 51, dog 3\nb - dog 2\nc - a 5\ndog - c 3'
    this.state = {
      ...App.updateResult(value),
    };

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    this.setState(
      App.updateResult(event.target.value)
    )
  }

  static parse(line) {
    const regex = /(\w+)\s*-\s*(.*)/
    const match = regex.exec(line);
    let out = 'empty\n'
    if (match) {
      const name = match[1]
      const connections = match[2]
      
      let connectionString = ''
      for (const connection of connections.split(',')) {
        const trimmed = connection.trim()
        const regex = /(\w+)\s*(\d+)/
        const match = regex.exec(connection);
        const destination = match[1]
        const length = match[2]
        connectionString += `[${destination} : ${length}] `
      }

      out = `${name} ➤ ${connectionString}\n`
      console.log(match)
    }
    return out
  }

  static updateResult(text) {
    let lineCount = 1; // rough estimate of lines

    let lines = text.split('\n');
    let output = ''
    for(let i = 0; i < lines.length; i++) {
      const line = lines[i];

      lineCount += 1 + Math.floor(line.length / 38);
      
      output += this.parse(line)
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
        </div>
      </div>
    )
  }
}

export default App;
