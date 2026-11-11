import numpy as np
from horizon import angle_exact, dest_points

R = 1737400.0

def test_flat_dip():                      # plan: about 0.087 deg at 2 m, 0.194 deg at 10 m
    s = np.arange(10, 150_000, 10.0)
    assert abs(angle_exact(s, 0, 0, 2).max() + 0.087) < 0.002
    assert abs(angle_exact(s, 0, 0, 10).max() + 0.194) < 0.002

def test_hill():                          # 1 km hill at 10 km, about 5.53 deg (my hand calculation)
    a = angle_exact(np.array([10_000.0]), 1000.0, 0.0, 2.0)[0]
    assert abs(a - 5.53) < 0.02

def test_north_move():                    # 1 degree of arc north of 80S gives 79S
    lon, lat = dest_points(-80, 10, np.array([0.0]), np.array([R * np.radians(1)]))
    assert abs(lat[0, 0] + 79) < 1e-6 and abs(lon[0, 0] - 10) < 1e-6
