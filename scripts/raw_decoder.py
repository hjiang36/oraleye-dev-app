import os
import argparse
import numpy as np
import imageio



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
        help="Whether to normalize 10bit to fit full 16 bit")
    return parser.parse_args()

if __name__ == '__main__':
    # Get arguments
    args = parse_args()

    # Check input file exists
    if not os.path.exists(args.input):
        raise ValueError("Input file does not exist")
    
    # Width, height, bit depth
    width, height = 4608, 2592
    bit_depth = 10
    
    # Read packed data
    raw_data = np.fromfile(args.input, dtype=np.uint8)
    if len(raw_data) != width * height * bit_depth // 8:
        raise ValueError("Invalid file size")
    
    print(np.max(raw_data))
    
    # Unpack data
    raw_data = np.reshape(raw_data, (height, width * bit_depth // 8)).astype(np.uint16)
    raw = np.zeros((height, width), dtype=np.uint16)

    for i in range(4):
        raw[:, i::4] = raw_data[:, i::5] * 4 + ((raw_data[:, 4::5] >> (6 - 2 * i)) & 3)
    
    if args.normalize:
        raw = raw * (2 ** 6)

    print(np.min(raw), np.max(raw))
        
    # Write to PNG file
    imageio.imwrite(args.output, raw)

    
