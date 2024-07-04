import os
import pkg_resources


def calc_container(path):
    total_size = 0
    for dirpath, dirnames, filenames in os.walk(path):
        for f in filenames:
            fp = os.path.join(dirpath, f)
            total_size += os.path.getsize(fp)
    return total_size


dists = [d for d in pkg_resources.working_set]
results = []

for dist in dists:
    try:
        path = os.path.join(dist.location, dist.project_name)
        size = calc_container(path)
        if size / 1000 > 1.0:
            results.append((dist, size / 1000))
    except OSError:
        '{} no longer exists'.format(dist.project_name)

# Sort results by size (second element in tuple)
results.sort(key=lambda x: x[1], reverse=True)

# Print sorted results
for dist, size_kb in results:
    print(f"{dist}: {size_kb} KB")
    print("-" * 40)
