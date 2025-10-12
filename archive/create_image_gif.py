#!/usr/bin/env python3
"""
Script to create an animated GIF from multiple images in survery_assets
"""

import os
import subprocess
import sys
from pathlib import Path

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
    
    # Create input list for ffmpeg
    input_list = []
    for image in images:
        image_path = assets_dir / image
        # Each image will be shown for 3 seconds with crossfade transitions
        input_list.extend([
            '-loop', '1', '-t', '3', '-i', str(image_path)
        ])
    
    # Output GIF
    output_gif = output_dir / "survey_images_animated.gif"
    
    # Create filter complex for crossfade transitions
    filter_parts = []
    num_images = len(images)
    
    # Create crossfade transitions between images
    for i in range(num_images - 1):
        if i == 0:
            # First transition: from image 0 to image 1
            filter_parts.append(f"[0:v][1:v]xfade=transition=fade:duration=0.5:offset=2.5[v{i+1}]")
        else:
            # Subsequent transitions
            filter_parts.append(f"[v{i}][{i+1}:v]xfade=transition=fade:duration=0.5:offset=2.5[v{i+1}]")
    
    filter_complex = ";".join(filter_parts)
    
    # Build the final ffmpeg command
    cmd = [
        'ffmpeg', '-y'
    ] + input_list + [
        '-filter_complex', filter_complex,
        '-map', f'[v{num_images-1}]',
        '-r', '15',  # 15 fps
        '-loop', '0',
        str(output_gif)
    ]
    
    if not run_command(cmd, "Creating animated GIF with crossfade transitions"):
        print("Crossfade failed, trying simpler approach...")
        
        # Fallback: simpler approach without crossfade
        cmd_simple = [
            'ffmpeg', '-y'
        ] + input_list + [
            '-filter_complex', f'[0:v][1:v][2:v][3:v][4:v][5:v]concat=n=6:v=1:a=0[v]',
            '-map', '[v]',
            '-r', '10',
            '-loop', '0',
            str(output_gif)
        ]
        
        if not run_command(cmd_simple, "Creating animated GIF with simple concatenation"):
            print("Simple concatenation failed, trying individual frame approach...")
            
            # Final fallback: convert to individual frames then to GIF
            temp_dir = output_dir / "temp_frames"
            temp_dir.mkdir(exist_ok=True)
            
            # Convert each image to frames
            for i, image in enumerate(images):
                image_path = assets_dir / image
                frame_pattern = temp_dir / f"frame_{i:03d}_%03d.png"
                
                cmd_frames = [
                    'ffmpeg', '-y',
                    '-loop', '1', '-t', '3', '-i', str(image_path),
                    '-vf', 'fps=10',
                    str(frame_pattern)
                ]
                
                if not run_command(cmd_frames, f"Converting {image} to frames"):
                    continue
            
            # Combine all frames into GIF
            all_frames = sorted(list(temp_dir.glob("*.png")))
            if all_frames:
                cmd_gif = [
                    'ffmpeg', '-y',
                    '-framerate', '10',
                    '-i', str(temp_dir / "frame_%03d_%03d.png"),
                    '-loop', '0',
                    str(output_gif)
                ]
                
                if not run_command(cmd_gif, "Creating GIF from individual frames"):
                    sys.exit(1)
            
            # Clean up temp frames
            import shutil
            if temp_dir.exists():
                shutil.rmtree(temp_dir)
                print("Cleaned up temporary frames")
    
    print(f"\n✓ Successfully created animated GIF: {output_gif}")
    print(f"File size: {output_gif.stat().st_size / (1024*1024):.1f} MB")
    print(f"Included {len(images)} images with smooth transitions")

if __name__ == "__main__":
    main()
