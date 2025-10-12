#!/usr/bin/env python3
"""
Script to crop a portrait video to horizontal format
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
    input_video = Path("/Users/kunalaneja/Documents/PersonalWebsite/public/20251012_1752_01k7d6513netgbcc05y5aaaasb.mp4")
    output_video = Path("/Users/kunalaneja/Documents/PersonalWebsite/public/video_horizontal.mp4")
    
    # Check if input video exists
    if not input_video.exists():
        print(f"Error: {input_video} not found")
        sys.exit(1)
    
    print("Converting portrait video to horizontal format...")
    print(f"Input: {input_video.name}")
    print(f"Original dimensions: 704x1280 (portrait)")
    
    # Calculate crop parameters for horizontal format
    # Original: 704x1280 (portrait)
    # Target: crop to make it horizontal (e.g., 1280x720 or 1280x704)
    
    # Option 1: Crop from center to get 704x704 (square), then scale to 1280x720
    # Option 2: Crop to get maximum horizontal area
    
    # Let's go with Option 1 for a standard 16:9 aspect ratio
    target_width = 1280
    target_height = 720
    
    # Crop from center of the portrait video
    # We'll take a 704x704 square from the center, then scale to 1280x720
    crop_size = 704  # Crop a square from the center
    crop_x = 0  # Center horizontally (704-704)/2 = 0
    crop_y = (1280 - crop_size) // 2  # Center vertically (1280-704)/2 = 288
    
    cmd = [
        'ffmpeg', '-y',
        '-i', str(input_video),
        '-vf', f'crop={crop_size}:{crop_size}:{crop_x}:{crop_y},scale={target_width}:{target_height}',
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '128k',
        str(output_video)
    ]
    
    if not run_command(cmd, f"Cropping and scaling video to {target_width}x{target_height}"):
        print("Failed with center crop, trying different approach...")
        
        # Alternative: Crop from top to get more content
        crop_y = 0  # Start from top
        
        cmd_alt = [
            'ffmpeg', '-y',
            '-i', str(input_video),
            '-vf', f'crop={crop_size}:{crop_size}:{crop_x}:{crop_y},scale={target_width}:{target_height}',
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '23',
            '-c:a', 'aac',
            '-b:a', '128k',
            str(output_video)
        ]
        
        if not run_command(cmd_alt, f"Alternative cropping from top to {target_width}x{target_height}"):
            print("Failed with top crop, trying bottom crop...")
            
            # Alternative: Crop from bottom
            crop_y = 1280 - crop_size  # Start from bottom
            
            cmd_bottom = [
                'ffmpeg', '-y',
                '-i', str(input_video),
                '-vf', f'crop={crop_size}:{crop_size}:{crop_x}:{crop_y},scale={target_width}:{target_height}',
                '-c:v', 'libx264',
                '-preset', 'fast',
                '-crf', '23',
                '-c:a', 'aac',
                '-b:a', '128k',
                str(output_video)
            ]
            
            if not run_command(cmd_bottom, f"Bottom cropping to {target_width}x{target_height}"):
                sys.exit(1)
    
    print(f"\n✓ Successfully created horizontal video: {output_video}")
    print(f"Output dimensions: {target_width}x{target_height}")
    
    # Show file sizes
    input_size = input_video.stat().st_size / (1024*1024)
    output_size = output_video.stat().st_size / (1024*1024)
    print(f"Input file size: {input_size:.1f} MB")
    print(f"Output file size: {output_size:.1f} MB")

if __name__ == "__main__":
    main()
