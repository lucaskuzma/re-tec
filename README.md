# re-TEC

## WTF

> Revisiting networks as sequencers.

This project is a React app that lets you live-code a network of neuron-like nodes, some of which can emit sounds.

Sounds are generated using (Tone.js)[https://tonejs.github.io]. You might have to click in your browser to get it to play.

Define nodes like this:

    [name] [threshold] [self-stimulation-period] > [destination] [distance]

If node names are note names, like `c3`, they will emit sounds.

There is also a basic sequencer which cycles through the words in the bottom text field. If any of these match a node name, that node will be stimulated.

## Status

This is just a proof-of-concept, so there is not much functionality here. Fork and hack away!

## Build instructions

In the project directory, you can run:

### `npm install`

Download and use ~18 billion untrusted dependencies.

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

There are no useful tests here.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.
