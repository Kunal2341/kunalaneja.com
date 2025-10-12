#!/usr/bin/env python3
"""
Simple script to create an animated GIF from multiple images
First normalizes all images to the same size, then creates the GIF
"""

import os
import subprocess
import sys
from pathlib import Path
import shutil

def run_command(cmd, description):
    """Run a command and handle errors"""
    print(f"\n{description}...")
    print(f"Running: {' '.join(cmd)}")
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print("✓ Success")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Error: {e}")
        print(f"stdout: {e.stdout}")
        print(f"stderr: {e.stderr}")
        return False

def check_ffmpeg():
    """Check if ffmpeg is installed"""
    try:
        subprocess.run(['ffmpeg', '-version'], check=True, capture_output=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def main():
    # Check if ffmpeg is available
    if not check_ffmpeg():
        print("Error: ffmpeg is not installed or not in PATH")
        print("Please install ffmpeg first: https://ffmpeg.org/download.html")
        sys.exit(1)
    
    # Define paths
    assets_dir = Path("/Users/kunalaneja/Documents/PersonalWebsite/survery_assets")
    output_dir = Path("/Users/kunalaneja/Documents/PersonalWebsite/survery_assets")
    
    # Image files in order
    images = [
        "affordance.png",
        "GraspDatasetFigure.png", 
        "HandsFigure_Horizontal.png",
        "HandsFigure.png",
        "OverallFigure.png",
        "robot_hand_banana.png"
    ]
    
    # Check if all images exist
    for image in images:
        image_path = assets_dir / image
        if not image_path.exists():
            print(f"Error: {image_path} not found")
            sys.exit(1)
    
    print("Creating animated GIF from survey images...")
    print(f"Images to include: {', '.join(images)}")
    
    # Create temp directory for normalized images
    temp_dir = output_dir / "temp_normalized"
    if temp_dir.exists():
        shutil.rmtree(temp_dir)
    temp_dir.mkdir()
    
    # Target size (choose a good common size)
    target_width = 800
    target_height = 600
    
    # Normalize all images to the same size
    normalized_images = []
    for i, image in enumerate(images):
        input_path = assets_dir / image
        output_path = temp_dir / f"normalized_{i:02d}.png"
        
        # Resize and pad to target dimensions
        cmd = [
            'ffmpeg', '-y',
            '-i', str(input_path),
            '-vf', f'scale={target_width}:{target_height}:force_original_aspect_ratio=decrease,pad={target_width}:{target_height}:(ow-iw)/2:(oh-ih)/2:color=white',
            str(output_path)
        ]
        
        if not run_command(cmd, f"Normalizing {image} to {target_width}x{target_height}"):
            sys.exit(1)
        
        normalized_images.append(output_path)
    
    # Create input list for concatenation
    input_list = []
    for img in normalized_images:
        input_list.extend(['-i', str(img)])
    
    # Create the GIF using simple concatenation
    output_gif = output_dir / "survey_images_animated.gif"
    
    cmd = [
        'ffmpeg', '-y'
    ] + input_list + [
        '-filter_complex', f'[0:v][1:v][2:v][3:v][4:v][5:v]concat=n=6:v=1:a=0[v]',
        '-map', '[v]',
        '-r', '8',  # 8 fps
        '-loop', '0',
        str(output_gif)
    ]
    
    if not run_command(cmd, "Creating animated GIF from normalized images"):
        print("Concatenation failed, trying individual frame approach...")
        
        # Fallback: create individual frames for each image
        frame_dir = temp_dir / "frames"
        frame_dir.mkdir()
        
        # Create frames for each image (3 seconds each at 8 fps = 24 frames)
        for i, img in enumerate(normalized_images):
            frame_pattern = frame_dir / f"frame_{i:02d}_%03d.png"
            
            cmd_frames = [
                'ffmpeg', '-y',
                '-loop', '1', '-t', '3', '-i', str(img),
                '-vf', 'fps=8',
                str(frame_pattern)
            ]
            
            if not run_command(cmd_frames, f"Creating frames for image {i}"):
                continue
        
        # Get all frame files and sort them
        all_frames = sorted(list(frame_dir.glob("*.png")))
        
        if all_frames:
            # Create a pattern file for ffmpeg
            pattern_file = temp_dir / "pattern.txt"
            with open(pattern_file, 'w') as f:
                for frame in all_frames:
                    f.write(f"file '{frame.absolute()}'\n")
                    f.write("duration 0.125\n")  # 0.125 seconds per frame (8 fps)
            
            # Create GIF from pattern
            cmd_gif = [
                'ffmpeg', '-y',
                '-f', 'concat',
                '-safe', '0',
                '-i', str(pattern_file),
                '-loop', '0',
                str(output_gif)
            ]
            
            if not run_command(cmd_gif, "Creating GIF from frame pattern"):
                sys.exit(1)
    
    # Clean up temporary files
    print("\nCleaning up temporary files...")
    if temp_dir.exists():
        shutil.rmtree(temp_dir)
        print("Removed temporary directory")
    
    print(f"\n✓ Successfully created animated GIF: {output_gif}")
    print(f"File size: {output_gif.stat().st_size / (1024*1024):.1f} MB")
    print(f"Included {len(images)} images with {target_width}x{target_height} resolution")

if __name__ == "__main__":
    main()
