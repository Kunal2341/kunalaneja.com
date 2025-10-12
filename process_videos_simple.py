#!/usr/bin/env python3
"""
Simple script to process i2g2ro_assets videos and create a combined GIF
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
    assets_dir = Path("/Users/kunalaneja/Documents/PersonalWebsite/i2g2ro_assets")
    output_dir = Path("/Users/kunalaneja/Documents/PersonalWebsite/i2g2ro_assets")
    
    # Video files
    aa_video = assets_dir / "aa.mp4"
    bbbb_video = assets_dir / "BBBB.mp4"
    isaac_video = assets_dir / "IsaacLabGraspExecution.mp4"
    screencast_video = assets_dir / "Screencast from 04-04-2025 12_54_11 PM.mp4"
    
    # Output files
    aa_processed = output_dir / "aa_processed.mp4"
    bbbb_processed = output_dir / "bbbb_processed.mp4"
    isaac_processed = output_dir / "isaac_processed.mp4"
    screencast_processed = output_dir / "screencast_processed.mp4"
    combined_gif = output_dir / "i2g2ro_combined_final.gif"
    
    # Check if input files exist
    for video_file in [aa_video, bbbb_video, isaac_video, screencast_video]:
        if not video_file.exists():
            print(f"Error: {video_file} not found")
            sys.exit(1)
    
    print("Processing i2g2ro_assets videos with simple GIF conversion...")
    
    # 1. Process aa.mp4: First 6 seconds, speed up 2.5x
    cmd1 = [
        'ffmpeg', '-y',
        '-i', str(aa_video),
        '-t', '6',  # First 6 seconds
        '-filter:v', 'setpts=0.4*PTS',  # Speed up 2.5x (1/2.5 = 0.4)
        '-c:a', 'aac',
        '-b:a', '128k',
        str(aa_processed)
    ]
    
    if not run_command(cmd1, "Processing aa.mp4 (first 6 seconds, 2.5x speed)"):
        sys.exit(1)
    
    # 2. Process BBBB.mp4: Take first 3 seconds (no speed change)
    cmd2 = [
        'ffmpeg', '-y',
        '-i', str(bbbb_video),
        '-t', '3',  # First 3 seconds
        '-c:v', 'libx264',
        '-c:a', 'aac',
        str(bbbb_processed)
    ]
    
    if not run_command(cmd2, "Processing BBBB.mp4 (first 3 seconds)"):
        sys.exit(1)
    
    # 3. Process IsaacLabGraspExecution.mp4: Speed up 5x
    cmd3 = [
        'ffmpeg', '-y',
        '-i', str(isaac_video),
        '-filter:v', 'setpts=0.2*PTS',  # Speed up 5x (1/5 = 0.2)
        '-c:a', 'aac',
        '-b:a', '128k',
        str(isaac_processed)
    ]
    
    if not run_command(cmd3, "Processing IsaacLabGraspExecution.mp4 (5x speed)"):
        sys.exit(1)
    
    # 4. Process Screencast video: Take first 4 seconds (no speed change)
    cmd4 = [
        'ffmpeg', '-y',
        '-i', str(screencast_video),
        '-t', '4',  # First 4 seconds
        '-c:v', 'libx264',
        '-c:a', 'aac',
        str(screencast_processed)
    ]
    
    if not run_command(cmd4, "Processing Screencast video (first 4 seconds)"):
        sys.exit(1)
    
    # 5. Create a file list for concatenation
    filelist_path = output_dir / "filelist.txt"
    with open(filelist_path, 'w') as f:
        f.write(f"file '{aa_processed.absolute()}'\n")
        f.write(f"file '{bbbb_processed.absolute()}'\n")
        f.write(f"file '{isaac_processed.absolute()}'\n")
        f.write(f"file '{screencast_processed.absolute()}'\n")
    
    # 6. Concatenate all processed videos
    combined_mp4 = output_dir / "i2g2ro_combined.mp4"
    cmd5 = [
        'ffmpeg', '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', str(filelist_path),
        '-c', 'copy',
        str(combined_mp4)
    ]
    
    if not run_command(cmd5, "Concatenating all processed videos"):
        sys.exit(1)
    
    # 7. Convert to GIF with simple settings
    cmd6 = [
        'ffmpeg', '-y',
        '-i', str(combined_mp4),
        '-vf', 'fps=8,scale=640:-1',
        '-loop', '0',
        str(combined_gif)
    ]
    
    if not run_command(cmd6, "Converting to GIF"):
        sys.exit(1)
    
    # Clean up temporary files
    print("\nCleaning up temporary files...")
    temp_files = [aa_processed, bbbb_processed, isaac_processed, screencast_processed, combined_mp4, filelist_path]
    for temp_file in temp_files:
        if temp_file.exists():
            temp_file.unlink()
            print(f"Removed: {temp_file.name}")
    
    print(f"\n✓ Successfully created combined GIF: {combined_gif}")
    print(f"File size: {combined_gif.stat().st_size / (1024*1024):.1f} MB")

if __name__ == "__main__":
    main()
