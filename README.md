# StyleGAN2-Electron

![alt text](https://github.com/Kasidit0052/StyleGAN2_Electron/blob/main/application-sample.png)
<p align="center">An Intuitive Approach to inference StyleGAN2</p>

## How to run ? ##
*  Create a python virtual environment using anaconda (Tested on python 3.7.3)
*  run requirement.txt for stylegan2_pytorch (in your created virtual environment)
   ```
   pip install pip install -r requirements.txt 
   ```

*  Download and Convert Pretrained Model 
    *  Download Pretrained StyleGAN2 Model (this project use model and dlatents from GWERN StyleGAN2 pretrained model)
    *  Convert StyleGAN2 tf pretrained model to pytorch using script in ./stylegan2_pytorch directory/pretrained_model
       ```
       run_convert_from_tf.py --input="Path/To/PKL_MODEL"  --output="stylegan2_pytorch/pretrained_model" 
       ```
  
*  Install packages
   ```
   Yarn install and Yarn start
   ```
   
*  Setup python path using interface in application

## How to Deploy ? ##
   ```
   Yarn Package
   ```

## StyleGAN2 Tutorial Notebook for those who want to explore StyleGAN2 ##
There is a tutorial notebook in /stylegan2_pytorch folder which demostrate a basic function to Generate and Interpolate Image 

## Special Thanks to ##
*  <a>https://github.com/gwern for anime stylegan2 pretrained model</a>
*  <a>https://github.com/halcy for pretrained latent direction and the crucial concept of StyleGAN2
*  <a>https://github.com/viuts for the ways to convert tf model to pytorch model to support my macbook pro cpu
