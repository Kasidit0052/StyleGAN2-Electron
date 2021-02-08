import React,{Fragment, useState} from 'react';
import Slider from '@material-ui/core/Slider';
import { withStyles } from '@material-ui/core/styles';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import './App.global.css';
//Import Inter-Process Communication
const ipcRenderer  = window.require("electron").ipcRenderer;

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
  // Variable to store ImageURI
  const [imageData, setImageData] = useState()
  // Variable to Loop Create Slider
  const [chunklists,setChunkLists] = useState<string[][]>([[],[]]) 
  // List of all avaiable tag
  const [lists, setlists] = useState<string[]>([])
  // Variable to store TagValue
  const [tagValue, setTagValue] = useState<{}>({"test":1.0})

  // Handle on Slider Value Changes
  function handleInputChange(event,value,id)
  {
    interface CustomDict {
      [index: string]: number;
    }
    let updatedValue: CustomDict;
    let updatedKey = id.item
    updatedValue = {}
    updatedValue[updatedKey] = value
    setTagValue({...tagValue, ...updatedValue});
  }

  // handle on Create New Image
  function handleOnCreate(){
    console.log("generate new images")
    ipcRenderer.send('creation_event')
  }

  // handle on Modify Current Image
  function handleOnModify(){
    console.log("modify images")
    ipcRenderer.send('modification_event',tagValue)
  }

  // handle Create Slider UI
  function handleSetChunk(){
    const groups = lists.map((e, i) => { 
         return i % chunkSize === 0 ? lists.slice(i, i + chunkSize) : ["null"]; 
    }).filter(function (el) {return el[0] !== "null";});
    setChunkLists(groups)
  }
  function handleCreateTagValue(){
    var tag_value_obj = lists.reduce((o, key) => Object.assign(o, {[key]: 0.0}), {});
    setTagValue(tag_value_obj)
  }

  // General state changes listener
  React.useEffect(() => {
    // Event Listener for changing image in Real-Time
    ipcRenderer.on('inference image', (event, value) => {
      console.log(`Image name:${value.image_name}`);
      setImageData(value.image_data);
    })
    // Event Listener for initialization
    ipcRenderer.on('Init Interface', (event, value) => {
      setlists(value);
    })
  }, [])

  // This is be executed when 'list' state changes (for initialization)
  React.useEffect(() => { 
    handleSetChunk(); 
    handleCreateTagValue();
    console.log("state changes")
  }, [lists])

  return (
    <div>

      <div className="Hello">
        <h1 style={{color:"black"}}>electron-stylegan-interface</h1>
      </div>

      <div className="Hello">
          <img id="show" src={imageData} style={{width:"400px",height:"400px"}} />
      </div>

      <div className="Hello">
        <table style = {{width:"100%"}}>
            <tbody>
            {
              chunklists.map((chunk) => (
                <tr>
                  {
                    chunk.map((item) => (
                        <Fragment>
                          <td style = {{width:"20%"}}>
                              <PrettoSlider valueLabelDisplay="auto" aria-label="pretto slider" defaultValue={0} step={0.10} min={-5.0} max={5.0}  onChangeCommitted={(event,value) => handleInputChange(event,value,{item})}/>
                          </td>
                          <td>
                              <a>{item}</a>
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

      <div className="Hello">
          <button type="button" onClick={() => {handleOnCreate()}}>
            Generate New Sample
          </button>
          <button type="button" onClick={() => {handleOnModify()}}>
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