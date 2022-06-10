import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as patches

def intersection(dx1,dy1,x1,y1,dx2,dy2,x2,y2):
    a1 = dy1*dx2; b1 = y1*dx2*dx1 - x1*a1
    a2 = dy2*dx1; b2 = y2*dx1*dx2 - x2*a2
    x = (b2-b1)/(a1-a2)
    c1 = dx1*dy2; d1 = x1*dy2*dy1 - y1*c1
    c2 = dx2*dy1; d2 = x2*dy1*dy2 - y2*c2
    y = (d2-d1)/(c1-c2)
    return [x,y]

def line_sect(L1,L2):
    [[x1,y1],[x2,y2]] = L1
    [[x3,y3],[x4,y4]] = L2
    
    if (max(x1,x2)<=min(x3,x4) or min(x1,x2)>=max(x3,x4) or
        max(y1,y2)<=min(y3,y4) or min(y1,y2)>=max(y3,y4) ):
        return []
    else:
        dx1 = x2-x1; dy1 = y2-y1
        dx2 = x4-x3; dy2 = y4-y3
        d = dx1*dy2 - dy1*dx2
        if d == 0:
            return []
        else:
            t = ((x3-x1)*dy2 - (y3-y1)*dx2)/d
            if t>0 and t<1:
                u = ((x3-x1)*dy1 - (y3-y1)*dx1)/d
                if u>0 and u<1:
                    x = x1 + t*dx1
                    y = y1 + t*dx1               
                    return [x,y]
            return []
            
def circ_sect(L,E):
    [[x1,y1],[x2,y2]] = L
    [[x,y],r] = E
    
    if (max(x1,x2)<=x-r or min(x1,x2)>=x+r or 
        max(y1,y2)<=y-r or min(y1,y2)>=y+r ):
        return []
    else:
        dx = x2-x1; dy = y2-y1
        d = dx*dx+dy*dy
        dz = (x1-x)*(y2-y) - (x2-x)*(y1-y)
        t = r*r*d - dz*dz
        if t <= 0:
            return []
        else:
            ans = []
            t = np.sqrt(t)
            x3 = (dz*dy+sign(dy)*dx*t)/d +x
            x4 = (dz*dy-sign(dy)*dx*t)/d +x
            y3 = (-dz*dx+np.abs(dy)*t)/d +y
            y4 = (-dz*dx-np.abs(dy)*t)/d +y
            if x3>min(x1,x2) and x3<max(x1,x2):
                ans.append([x3,y3])
            if x4>min(x1,x2) and x4<max(x1,x2):
                ans.append([x4,y4])
            return ans

def above_line(p,L):
    [[x1,y1],[x2,y2]] = L
    [x,y] = p
    d = (x-x1)*(y2-y1) - (y-y1)*(x2-x1)
    return d
    

def sign(val):
    if val >= 0:
        return 1
    else:
        return -1


def polygon(p,dir=1):
    
    dx = []; dy =[]
    for i in range(len(p)):
        j = i+1
        if j >= len(p): j = 0
        dx_ = p[j][0] - p[i][0]  
        dy_ = p[j][1] - p[i][1] 
        d = np.sqrt(dx_*dx_+dy_*dy_)
        dx.append(dx_/d)
        dy.append(dy_/d)
    
    P = []
    L = []; L_ = []
    C = []
    for i in range(len(p)):
        
        j = i-1
        if j < 0: j = len(p)+j
        
        angle = np.arctan2(dy[j],dx[j])-np.arctan2(dy[i],dx[i])
        if angle >  np.pi: angle -= 2*np.pi
        if angle < -np.pi: angle += 2*np.pi
        
        if dir > 0:
            dx1 = -dy[j]; dy1 = dx[j]
            dx2 = -dy[i]; dy2 = dx[i]
        else:
            angle = -angle
            dx1 = dy[j]; dy1 = -dx[j]
            dx2 = dy[i]; dy2 = -dx[i]
             
        if angle > 0:
            P.append([p[i],[dx1,dy1]])
            P.append([p[i],[dx2,dy2]])
            C.append([p[i],len(P)-2,len(P)-1])
            L_.extend([len(P)-2,-1,len(P)-1])
        elif angle == 0:
            pass    
        else:
            p_ = intersection(dx[i],dy[i],p[i][0]+dx2,p[i][1]+dy2,
                              dx[j],dy[j],p[i][0]+dx1,p[i][1]+dy1)
            dx_ = p_[0] - p[i][0]
            dy_ = p_[1] - p[i][1]
            P.append([p[i],[dx_,dy_]])
            L_.append(len(P)-1)
            
    for i in range(len(L_)):
        j = i-1
        if j < 0: j = len(L_)+j
        if L_[i]>=0 and L_[j]>=0:
            L.append([L_[i],L_[j]])    
    
    return P,L,C

def update(P,s):
    N = [] 
    for i in range(len(P)):
        x = P[i][0][0] + P[i][1][0]*s
        y = P[i][0][1] + P[i][1][1]*s
        N.append([x,y])
    return N





# p = [[0,-1],[0,2],[1,1],[5,4],[3,-2]]
# s = 1

# P,L,C = polygon(p)
# N = update(P,s)
    
# plt.axis('equal')
# for i in range(len(p)):
#     j = i-1
#     if j < 0: j = len(p)+j
#     plt.plot([p[i][0],p[j][0]],[p[i][1],p[j][1]],'b')
# # for i in range(len(N)):
# #     j = i-1
# #     if j < 0: j = len(N)+j
# #     plt.plot([N[i][0],N[j][0]],[N[i][1],N[j][1]],'k--')
# for i in range(len(L)):
#     plt.plot([N[L[i][0]][0],N[L[i][1]][0]],[N[L[i][0]][1],N[L[i][1]][1]],'b--')
# for i in range(len(C)):
#     arc = patches.Arc(C[i][0],s*2,s*2)
#     plt.gca().add_patch(arc)
#     plt.plot([N[C[i][1]][0],N[C[i][2]][0]],[N[C[i][1]][1],N[C[i][2]][1]],'k--')
    


ans = circ_sect([[0,2],[4,2]],[[2,3],1.5])

