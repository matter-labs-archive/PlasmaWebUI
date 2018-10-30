#!/bin/bash
echo "Building all submodules while checking out from MASTER branch..."

git submodule update 
git submodule foreach git checkout master 
git submodule foreach git pull origin master 