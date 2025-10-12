#!/usr/bin/env python3
"""
High-quality script to create an animated GIF from multiple images
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
    
    print("Creating HIGH-QUALITY animated GIF from survey images...")
    print(f"Images to include: {', '.join(images)}")
    
    # Create temp directory for processing
    temp_dir = output_dir / "temp_hq"
    if temp_dir.exists():
        shutil.rmtree(temp_dir)
    temp_dir.mkdir()
    
    # Higher target resolution
    target_width = 1200
    target_height = 900
    
    # Normalize all images to the same size with high quality
    normalized_images = []
    for i, image in enumerate(images):
        input_path = assets_dir / image
        output_path = temp_dir / f"hq_{i:02d}.png"
        
        # High-quality resize with padding
        cmd = [
            'ffmpeg', '-y',
            '-i', str(input_path),
            '-vf', f'scale={target_width}:{target_height}:force_original_aspect_ratio=decrease,pad={target_width}:{target_height}:(ow-iw)/2:(oh-ih)/2:color=white',
            '-c:v', 'png',
            str(output_path)
        ]
        
        if not run_command(cmd, f"Creating high-quality normalized version of {image}"):
            sys.exit(1)
        
        normalized_images.append(output_path)
    
    # Create individual video segments for each image (4 seconds each)
    video_segments = []
    for i, img in enumerate(normalized_images):
        video_path = temp_dir / f"segment_{i:02d}.mp4"
        
        cmd = [
            'ffmpeg', '-y',
            '-loop', '1', '-t', '4', '-i', str(img),
            '-c:v', 'libx264',
            '-preset', 'slow',
            '-crf', '18',
            '-pix_fmt', 'yuv420p',
            '-vf', 'fps=12',
            str(video_path)
        ]
        
        if not run_command(cmd, f"Creating video segment for image {i}"):
            sys.exit(1)
        
        video_segments.append(video_path)
    
    # Create file list for concatenation
    filelist_path = temp_dir / "filelist.txt"
    with open(filelist_path, 'w') as f:
        for video in video_segments:
            f.write(f"file '{video.absolute()}'\n")
    
    # Concatenate all video segments
    combined_video = temp_dir / "combined.mp4"
    cmd = [
        'ffmpeg', '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', str(filelist_path),
        '-c', 'copy',
        str(combined_video)
    ]
    
    if not run_command(cmd, "Concatenating all video segments"):
        sys.exit(1)
    
    # Create high-quality GIF
    output_gif = output_dir / "survey_images_hq.gif"
    
    # First create a palette for better color quality
    palette_path = temp_dir / "palette.png"
    cmd_palette = [
        'ffmpeg', '-y',
        '-i', str(combined_video),
        '-vf', 'fps=12,scale=1200:900:flags=lanczos,palettegen',
        str(palette_path)
    ]
    
    if not run_command(cmd_palette, "Generating palette for high-quality GIF"):
        sys.exit(1)
    
    # Create GIF using the palette
    cmd_gif = [
        'ffmpeg', '-y',
        '-i', str(combined_video),
        '-i', str(palette_path),
        '-filter_complex', 'fps=12,scale=1200:900:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3',
        '-loop', '0',
        str(output_gif)
    ]
    
    if not run_command(cmd_gif, "Creating high-quality GIF with palette"):
        # Fallback to simple GIF
        print("Palette method failed, using simple high-quality GIF...")
        cmd_simple = [
            'ffmpeg', '-y',
            '-i', str(combined_video),
            '-vf', 'fps=12,scale=1200:900:flags=lanczos',
            '-loop', '0',
            str(output_gif)
        ]
        
        if not run_command(cmd_simple, "Creating simple high-quality GIF"):
            sys.exit(1)
    
    # Clean up temporary files
    print("\nCleaning up temporary files...")
    if temp_dir.exists():
        shutil.rmtree(temp_dir)
        print("Removed temporary directory")
    
    print(f"\n✓ Successfully created HIGH-QUALITY animated GIF: {output_gif}")
    print(f"File size: {output_gif.stat().st_size / (1024*1024):.1f} MB")
    print(f"Included {len(images)} images with {target_width}x{target_height} resolution")
    print("Quality improvements:")
    print("- Higher resolution (1200x900)")
    print("- Better frame rate (12 FPS)")
    print("- High-quality video processing")
    print("- 4 seconds per image for better viewing")

if __name__ == "__main__":
    main()
