import React, { Fragment, useState } from 'react';
import Slider from '@material-ui/core/Slider';
import TextField from '@material-ui/core/TextField';
import { withStyles } from '@material-ui/core/styles';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import './App.global.css';
//Import Inter-Process Communication
const ipcRenderer = window.require("electron").ipcRenderer;

//Create a slider style
const PrettoSlider = withStyles({
  root: {
    color: '#52af77',
    height: 8,
  },
  thumb: {
    height: 24,
    width: 24,
    backgroundColor: '#fff',
    border: '2px solid currentColor',
    marginTop: -8,
    marginLeft: -12,
    '&:focus, &:hover, &$active': {
      boxShadow: 'inherit',
    },
  },
  active: {},
  valueLabel: {
    left: 'calc(-50% + 4px)',
  },
  track: {
    height: 8,
    borderRadius: 4,
  },
  rail: {
    height: 8,
    borderRadius: 4,
  },
})(Slider);

const MainFrame = () => {

  // Number of slider per row
  const chunkSize = 5;
  // Application State
  const [isSetupReady, setIsSetupReady] = useState(false);
  // Python Path
  const [pythonPath, setPythonPath] = useState('');
  // Variable to store ImageURI
  const [imageData, setImageData] = useState();
  // Variable to Loop Create Slider
  const [chunklists, setChunkLists] = useState<string[][]>([[], []]);
  // List of all avaiable tag
  const [lists, setlists] = useState<string[]>([]);
  // Variable to store TagValue
  const [tagValue, setTagValue] = useState<{}>({ "test": 1.0 });

  // Handle on Slider Value Changes
  function handleInputChange(event, value, id) {
    interface CustomDict {
      [index: string]: number;
    }
    let updatedValue: CustomDict;
    let updatedKey = id.item;
    updatedValue = {};
    updatedValue[updatedKey] = value;
    setTagValue({ ...tagValue, ...updatedValue });
  }

  // handle on Create New Image
  function handleOnCreate() {
    console.log("generate new images....");
    ipcRenderer.send('creation_event');
  }

  // handle on Modify Current Image
  function handleOnModify() {
    console.log("modify images....");
    ipcRenderer.send('modification_event', tagValue);
  }

  // setup Python Interface
  function setupPythonPath() {
    console.log("setup python path....");
    ipcRenderer.send('pythonpath_init', pythonPath);
  }

  // handle Create Slider UI
  function handleSetChunk() {
    const groups = lists.map((e, i) => {
      return i % chunkSize === 0 ? lists.slice(i, i + chunkSize) : ["null"];
    }).filter(function (el) { return el[0] !== "null"; });
    setChunkLists(groups);
  }
  function handleCreateTagValue() {
    var tag_value_obj = lists.reduce((o, key) => Object.assign(o, { [key]: 0.0 }), {});
    setTagValue(tag_value_obj);
  }

  // General state changes listener
  React.useEffect(() => {
    // Event Listener for changing image in Real-Time
    ipcRenderer.on('Inference Image', (event, value) => {
      console.log(`Image name:${value.image_name}`);
      setImageData(value.image_data);
    });
    // Event Listener for initialization
    ipcRenderer.on('Init Interface', (event, value) => {
      setlists(value);
    });
    ipcRenderer.on('Get Python Path', (event, value) => {
      setPythonPath(value);
    });
    ipcRenderer.on('Init Ready', (event, value) => {
      setIsSetupReady(value);
    });
  }, [])

  // This is be executed when 'list' state changes (for initialization)
  React.useEffect(() => {
    handleSetChunk();
    handleCreateTagValue();
  }, [lists])

  return (
    <div>

      <div className="Title">
        <h1 style={{ color: "black" }}>Electron StyleGAN2</h1>
      </div>

      <div className="Image">
        <img id="show" src={imageData} style={{ width: "400px", height: "400px", backgroundColor: "black" }} />
      </div>

      <div className="Parameter">
        <table style={{ width: "100%" }}>
          <tbody>
            {
              chunklists.map((chunk) => (
                <tr>
                  {
                    chunk.map((item) => (
                      <Fragment>
                        <td style={{ width: "20%" }}>
                          <PrettoSlider disabled={!isSetupReady} valueLabelDisplay="auto" aria-label="pretto slider" defaultValue={0.10} step={0.10} min={0.0} max={1.0} onChangeCommitted={(event, value) => handleInputChange(event, value, { item })} />
                        </td>
                        <td>
                          <a style={{ color: "black" }}>{item}</a>
                        </td>
                      </Fragment>
                    ))
                  }
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      <div className="PythonInterface">
        <TextField fullWidth label="Python Path" variant="standard" value={pythonPath} onChange={(event) => { setPythonPath(event.target.value) }} />
        <button type="button" onClick={() => { setupPythonPath() }}>
          Submit
        </button>
      </div>

      <div className="Button">
        <button type="button" disabled={!isSetupReady} style={{ backgroundColor: "#32CD32" }} onClick={() => { handleOnCreate() }}>
          Generate New Sample
        </button>
        <button type="button" disabled={!isSetupReady} style={{ backgroundColor: "#00CED1" }} onClick={() => { handleOnModify() }}>
          Modify Current Sample
        </button>
      </div>

    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={MainFrame} />
      </Switch>
    </Router>
  );
}
