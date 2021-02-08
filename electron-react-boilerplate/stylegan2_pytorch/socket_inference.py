#Import Libraries
import copy
import torch
import pickle
import base64
import socketio
import numpy as np
from io import BytesIO

import stylegan2
from stylegan2 import utils

tag_len = {}
tag_directions = {}
HAIR_EYES_ONLY = True
FILTERED_TAG_NAME = []
track_latent_zs = {'image_name': None, 'input_latent_space': None}

############# SocketIO API  ####################
sio = socketio.Client(logger=False, engineio_logger=False, reconnection=True)

@sio.event
def connect():
    global tag_len, tag_directions, FILTERED_TAG_NAME

    with open("pretrained_model/modded_dlatents/tag_dirs_cont.pkl", "rb") as f:
        tag_directions = pickle.load(f)

    if HAIR_EYES_ONLY:
        FILTERED_TAG_NAME = [tag for tag in tag_directions if "_hair" in tag or "_eyes" in tag or "_mouth" in tag]
    else:
        FILTERED_TAG_NAME = [tag for tag in tag_directions]

    for tag in tag_directions:
        tag_len[tag] = np.linalg.norm(tag_directions[tag].flatten())

    sio.emit('Init Interface', FILTERED_TAG_NAME)
    
    print('connection established')


@sio.on('create_new_image')
def generate_image():
    global track_latent_zs

    print('Generating New Images')
    input_seed = np.random.randint(10000000)
    input_zs = torch.stack([torch.from_numpy(np.random.RandomState(input_seed).randn(G.latent_size))])
    new_sample = latent_direction_Interface(G, input_zs, 0.9, {})
    data_url = pil2datauri(new_sample[0])
    track_latent_zs = {'image_name':input_seed, 'input_latent_space':input_zs}
    sio.emit('inference image',{ 'image_name': "seed_number_{}".format(input_seed), 'image_data': data_url})

@sio.on('modify_current_image')
def modify_image(data):
    print("Modify Current Images")
    modify_sample = latent_direction_Interface(G, track_latent_zs['input_latent_space'], 0.9,data)
    data_url = pil2datauri(modify_sample[0])
    sio.emit('inference image', { 'image_name': "seed_number_{}".format(track_latent_zs['image_name']), 'image_data': data_url})

@sio.event
def disconnect():
    print('disconnected from server')

##################################################


############# STYLEGAN2 PYTORCH API ##############
def latent_direction_Interface( G, zspace_input, truncation_psi, input_param):
    device = torch.device('cpu')
    G.to(device)
    G.static_noise()
    latent_size, label_size = G.latent_size, G.label_size
    G_mapping, G_synthesis = G.G_mapping, G.G_synthesis

    zspace_input = zspace_input.to(device=device, dtype=torch.float32)
    print("Z-size:{}".format(zspace_input.size()))
    
    if label_size:
        labels = torch.zeros(len(zspace_input), dtype=torch.int64, device=device)
    else:
        labels = None

    print('Generating disentangled latents...')
    with torch.no_grad():
        all_w = G_mapping(latents=zspace_input, labels=labels)

    all_w = all_w.unsqueeze(1).repeat(1, len(G_synthesis), 1)
    print("W-size:{}".format(all_w.size()))

    w_avg = G.dlatent_avg

    if truncation_psi != 1:
        all_w = w_avg + truncation_psi * (all_w - w_avg)
        
    dlatents_mod = copy.deepcopy(all_w[0])
    
    if(len(input_param)>0):
        for param_name, param_value in input_param.items():
            dlatents_mod += tag_directions[param_name] * param_value / tag_len[param_name] * 25.0

    progress = utils.ProgressWriter(1)
    progress.write('Generating images...', step=False)

    with torch.no_grad():
            tensor_image = G_synthesis(dlatents_mod.unsqueeze(0))
            progress.step()

    progress.write('Done!', step=False)
    progress.close()

    output_image = utils.tensor_to_PIL(tensor_image, pixel_min=-1, pixel_max=1)
    
    return output_image

def pil2datauri(img):
    #converts PIL image to datauri
    data = BytesIO()
    img.save(data, "JPEG")
    data64 = base64.b64encode(data.getvalue())
    return u'data:img/jpeg;base64,'+data64.decode('utf-8')

########################################################

G = stylegan2.models.load("pretrained_model/Gs.pth")

try:
    sio.connect('http://localhost:3030')
except:
    print("Retrying......")
sio.wait()
