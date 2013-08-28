
from random import randint, choice

NUM_STRIPES = 20
MIN_WID = 1;
MAX_WID = 2;

POSS_COLORS = ['#3498db', '#e74c3c', '#2ecc71', '#000000', '#FFFFFF']
# POSS_COLORS = ['#3498db', '#e74c3c', '#2ecc71', '#000000']

# percentages = []
# compound_ps = []
px_stops = [0]
colors = []

for x in range(0, NUM_STRIPES):
	# percentages.append(uniform(MIN_WID, MAX_WID))
	px_stops.append(px_stops[-1] + randint(10,18))

	while True:
		next_color = choice(POSS_COLORS)
		if not colors or next_color != colors[-1]:
			colors.append(next_color)
			break

# p_sum = sum(percentages) 
# percentages = [p / p_sum for p in percentages]
# for i in range(len(percentages)):
#	compound_ps.append(sum(percentages[:i+1]))

# print ["{} {}%".format(c,p*100) for (p,c) in zip(compound_ps, colors)]
print ["{} {}px".format(c,p) for (p,c) in zip(px_stops, colors)]