import os
import struct
import argparse
import re
import numpy as np
import imageio

"""
Get width / height / exposure time from the filename.
"""
def extract_info(filename):
    # Regular expression to find width (w\d+), height (h\d+), and exposure time (Expt_\d+us)
    pattern = r'w(\d+)_h(\d+)_.*Expt_(\d+)us'
    match = re.search(pattern, filename)

    if match:
        width = int(match.group(1))
        height = int(match.group(2))
        exposure_time = int(match.group(3))  # in microseconds
        return width, height, exposure_time
    else:
        return None

"""
Parse the raw binary file and convert it to a readable 16-bit PNG format.

"""
def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', type=str, required=True)
    parser.add_argument('--output', type=str, required=True)
    parser.add_argument(
        '--normalize',
        type=bool,
        default=False,
        help="Whether to normalize 12bit to fit full 16 bit")
    return parser.parse_args()

if __name__ == '__main__':
    # Get arguments
    args = parse_args()

    # Check input file exists
    if not os.path.exists(args.input):
        raise ValueError("Input file does not exist")
    
    # Parse filename to get width, height, and exposure time
    width, height, exposure_time = extract_info(args.input)
    # Create a numpy array
    raw = np.zeros((height, width), dtype=np.uint16)
    print("Width: {}, Height: {}, Exposure time: {} us".format(width, height, exposure_time))

    # Read binary file
    with open(args.input, 'rb') as f:
        for i in range(height):
            for j in range(0, width, 2):
                # 12 bit per pixel
                data = f.read(3)
                if (len(data) != 3):
                    print("Warning: Reached end of file")
                    print(len(data))
                    break
                compressed = struct.unpack('BBB', bytearray(data))
                raw[i, j] = compressed[0] | ((compressed[1] & 0x0F) << 8)
                raw[i, j+1] = (compressed[2] << 4) | (compressed[1] >> 4)
        
        # Normalize to 16 bit if needed
        if args.normalize:
            raw = raw * 16
        
        # Write to PNG file
        imageio.imwrite(args.output, raw)

    
