// Completed animations with fill:'forwards' still override a workspace's styles.
// Clear them before reusing that workspace for another dialog view.
export function clearWorkspaceAnimations(...workspaces) {
  for (const workspace of workspaces) {
    for (const animation of workspace.getAnimations()) animation.cancel();
  }
}

export function pageTurnFrames(direction, shiftX=0, shiftY=0) {
  const sign=direction<0?-1:1;
  return [
    {offset:0,transform:'translate3d(0px,0px,1px) rotateY(0deg)'},
    {offset:.5,transform:`translate3d(${shiftX/2}px,${shiftY/2}px,1px) rotateY(${-sign*90}deg)`},
    {offset:1,transform:`translate3d(${shiftX}px,${shiftY}px,1px) rotateY(${-sign*180}deg)`}
  ];
}
