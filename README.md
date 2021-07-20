# StyleGAN2-Electron

![alt text](https://github.com/Kasidit0052/StyleGAN2_Electron/blob/main/Screen%20Shot.png)
<p align="center">An Intuitive Approach to inference StyleGAN2</p>

## How to run ? ##
*  Create a python virtual environment using anaconda (Tested on python 3.7.3)

*  pip install pip install -r requirements.txt file in stylegan2_pytorch (in your created virtual environment)

*  Download and Convert Pretrained Model 
    *  Download Pretrained StyleGAN2 Model (we will use GWERN StyleGAN2 pretrained model)
    *  execute  [ run_convert_from_tf.py --input="Path/To/PKL_MODEL"  --output="stylegan2_pytorch/pretrained_model" ] from /stylegan2_pytorch directory
    
*  Setup python path in /electron-react-boilerplate/src/main.dev.ts 
    *  Example => PythonShell.run('socket_inference.py',{scriptPath: StyleGANPATH ,pythonPath: YOURPYTHONPATH })
  
*  Yarn install

*  Yarn start

## How to Deploy ? ##

*  Yarn Package

## StyleGAN2 Tutorial Notebook for those who want to explore StyleGAN2 ##
There is a tutorial notebook in /stylegan2_pytorch folder which demostrate a basic function to Generate and Interpolate Image 

## Special Thanks to ##
*  <a>https://github.com/gwern for anime stylegan2 pretrained model</a>
*  <a>https://github.com/halcy for pretrained latent direction and the crucial concept of StyleGAN2
*  <a>https://github.com/viuts for the ways to convert tf model to pytorch model to support my macbook pro cpu
