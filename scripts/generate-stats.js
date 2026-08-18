const fs = require("fs");

const USERNAME = "Kumar209";
const OUTPUT_FILE = "github-stats.svg";

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

async function main() {
  const token = process.env.GH_PROFILE_TOKEN;

  if (!token) {
    throw new Error(
      "GH_PROFILE_TOKEN environment variable is missing."
    );
  }

  console.log(`Fetching GitHub data for ${USERNAME}...`);

  const user = await fetchGitHubData(token);

  const svg = generateSVG(user);

  fs.writeFileSync(OUTPUT_FILE, svg, "utf8");

  console.log(`Generated ${OUTPUT_FILE}`);
}


// ============================================================
// GITHUB GRAPHQL
// ============================================================

async function fetchGitHubData(token) {
  const query = `
    query($username: String!) {
      user(login: $username) {

        login
        name

        followers {
          totalCount
        }

        following {
          totalCount
        }

        repositories(
          ownerAffiliations: OWNER
          first: 100
          privacy: PUBLIC
        ) {
          totalCount

          nodes {
            name
            stargazerCount

            primaryLanguage {
              name
            }
          }
        }

        contributionsCollection {

          totalCommitContributions

          totalIssueContributions

          totalPullRequestContributions

          totalPullRequestReviewContributions

          contributionCalendar {

            totalContributions

            weeks {

              contributionDays {
                contributionCount
                contributionLevel
                color
                date
                weekday
              }

            }
          }
        }
      }
    }
  `;

  const response = await fetch(
    GITHUB_GRAPHQL_URL,
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "Kumar209-GitHub-Stats",
      },

      body: JSON.stringify({
        query,
        variables: {
          username: USERNAME,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `GitHub API returned HTTP ${response.status}`
    );
  }

  const result = await response.json();

  if (result.errors) {
    console.error(result.errors);

    throw new Error(
      result.errors[0]?.message ||
        "GitHub GraphQL request failed."
    );
  }

  if (!result.data?.user) {
    throw new Error(
      `GitHub user "${USERNAME}" was not found.`
    );
  }

  return result.data.user;
}


// ============================================================
// SVG GENERATOR
// ============================================================

function generateSVG(user) {
  const contributions =
    user.contributionsCollection
      .contributionCalendar
      .totalContributions;

  const commits =
    user.contributionsCollection
      .totalCommitContributions;

  const pullRequests =
    user.contributionsCollection
      .totalPullRequestContributions;

  const issues =
    user.contributionsCollection
      .totalIssueContributions;

  const reviews =
    user.contributionsCollection
      .totalPullRequestReviewContributions;

  const repositories =
    user.repositories.totalCount;

  const followers =
    user.followers.totalCount;

  const following =
    user.following.totalCount;

  const stars =
    user.repositories.nodes.reduce(
      (total, repository) =>
        total + repository.stargazerCount,
      0
    );

  const contributionDays =
    user.contributionsCollection
      .contributionCalendar
      .weeks
      .flatMap(
        week => week.contributionDays
      );

  const contributionGraph =
    generateContributionGraph(
      contributionDays
    );

  const name =
    user.name || user.login;

  return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="1000"
  height="500"
  viewBox="0 0 1000 500"
>

  <defs>

    <linearGradient
      id="accent"
      x1="0%"
      y1="0%"
      x2="100%"
      y2="0%"
    >
      <stop
        offset="0%"
        stop-color="#7c3aed"
      />

      <stop
        offset="100%"
        stop-color="#2563eb"
      />
    </linearGradient>

  </defs>


  <!-- ====================================================== -->
  <!-- BACKGROUND -->
  <!-- ====================================================== -->

  <rect
    width="1000"
    height="500"
    rx="22"
    fill="#0d1117"
    stroke="#30363d"
    stroke-width="1"
  />


  <!-- ====================================================== -->
  <!-- TOP ACCENT -->
  <!-- ====================================================== -->

  <rect
    x="0"
    y="0"
    width="1000"
    height="6"
    rx="3"
    fill="url(#accent)"
  />


  <!-- ====================================================== -->
  <!-- HEADER -->
  <!-- ====================================================== -->

  <text
    x="45"
    y="52"
    fill="#ffffff"
    font-size="26"
    font-family="Arial, Helvetica, sans-serif"
    font-weight="700"
  >
    ${escapeXML(name)}
  </text>

  <text
    x="45"
    y="78"
    fill="#8b949e"
    font-size="15"
    font-family="Arial, Helvetica, sans-serif"
  >
    @${escapeXML(user.login)} · GitHub Activity
  </text>


  <!-- ====================================================== -->
  <!-- MAIN STAT CARDS -->
  <!-- ====================================================== -->

  ${statCard(
    45,
    105,
    "Repositories",
    repositories
  )}

  ${statCard(
    255,
    105,
    "Followers",
    followers
  )}

  ${statCard(
    465,
    105,
    "Stars",
    stars
  )}

  ${statCard(
    675,
    105,
    "Contributions",
    contributions
  )}


  <!-- ====================================================== -->
  <!-- SECONDARY STATS -->
  <!-- ====================================================== -->

  ${secondaryStat(
    45,
    "COMMITS",
    commits
  )}

  ${secondaryStat(
    210,
    "PULL REQUESTS",
    pullRequests
  )}

  ${secondaryStat(
    405,
    "ISSUES",
    issues
  )}

  ${secondaryStat(
    550,
    "PR REVIEWS",
    reviews
  )}

  ${secondaryStat(
    730,
    "FOLLOWING",
    following
  )}


  <!-- ====================================================== -->
  <!-- CONTRIBUTION TITLE -->
  <!-- ====================================================== -->

  <text
    x="45"
    y="300"
    fill="#ffffff"
    font-size="17"
    font-family="Arial, Helvetica, sans-serif"
    font-weight="700"
  >
    Contribution Activity
  </text>

  <text
    x="45"
    y="323"
    fill="#8b949e"
    font-size="13"
    font-family="Arial, Helvetica, sans-serif"
  >
    ${contributions.toLocaleString()} contributions in the last year
  </text>


  <!-- ====================================================== -->
  <!-- CONTRIBUTION GRAPH -->
  <!-- ====================================================== -->

  ${contributionGraph}


  <!-- ====================================================== -->
  <!-- LEGEND -->
  <!-- ====================================================== -->

  <text
    x="790"
    y="470"
    fill="#8b949e"
    font-size="11"
    font-family="Arial, Helvetica, sans-serif"
  >
    Less
  </text>

  ${legendBox(830, 460, "#161b22")}
  ${legendBox(845, 460, "#0e4429")}
  ${legendBox(860, 460, "#006d32")}
  ${legendBox(875, 460, "#26a641")}
  ${legendBox(890, 460, "#39d353")}

  <text
    x="910"
    y="470"
    fill="#8b949e"
    font-size="11"
    font-family="Arial, Helvetica, sans-serif"
  >
    More
  </text>


  <!-- ====================================================== -->
  <!-- FOOTER -->
  <!-- ====================================================== -->

  <text
    x="45"
    y="470"
    fill="#6e7681"
    font-size="11"
    font-family="Arial, Helvetica, sans-serif"
  >
    Generated automatically from GitHub data
  </text>

</svg>
`;
}


// ============================================================
// STAT CARD
// ============================================================

function statCard(
  x,
  y,
  label,
  value
) {
  return `
    <rect
      x="${x}"
      y="${y}"
      width="175"
      height="78"
      rx="13"
      fill="#161b22"
      stroke="#30363d"
    />

    <text
      x="${x + 16}"
      y="${y + 27}"
      fill="#8b949e"
      font-size="12"
      font-family="Arial, Helvetica, sans-serif"
    >
      ${label}
    </text>

    <text
      x="${x + 16}"
      y="${y + 58}"
      fill="#ffffff"
      font-size="24"
      font-family="Arial, Helvetica, sans-serif"
      font-weight="700"
    >
      ${Number(value).toLocaleString()}
    </text>
  `;
}


// ============================================================
// SECONDARY STAT
// ============================================================

function secondaryStat(
  x,
  label,
  value
) {
  return `
    <text
      x="${x}"
      y="220"
      fill="#8b949e"
      font-size="12"
      font-family="Arial, Helvetica, sans-serif"
    >
      ${label}
    </text>

    <text
      x="${x}"
      y="247"
      fill="#ffffff"
      font-size="22"
      font-family="Arial, Helvetica, sans-serif"
      font-weight="700"
    >
      ${Number(value).toLocaleString()}
    </text>
  `;
}


// ============================================================
// CONTRIBUTION GRAPH
// ============================================================

function generateContributionGraph(days) {
  const cellSize = 11;
  const gap = 3;

  const startX = 45;
  const startY = 350;

  let svg = "";

  days.forEach(
    (day, index) => {

      const week =
        Math.floor(index / 7);

      const weekday =
        day.weekday ?? index % 7;

      const x =
        startX +
        week * (cellSize + gap);

      const y =
        startY +
        weekday * (cellSize + gap);

      const color =
        day.color ||
        getContributionColor(
          day.contributionLevel
        );

      svg += `
        <rect
          x="${x}"
          y="${y}"
          width="${cellSize}"
          height="${cellSize}"
          rx="2.5"
          fill="${color}"
        >

          <title>
            ${escapeXML(day.date)}:
            ${day.contributionCount}
            contribution${day.contributionCount === 1 ? "" : "s"}
          </title>

        </rect>
      `;
    }
  );

  return svg;
}


// ============================================================
// CONTRIBUTION COLORS
// ============================================================

function getContributionColor(level) {

  const colors = {
    NONE: "#161b22",
    FIRST_QUARTILE: "#0e4429",
    SECOND_QUARTILE: "#006d32",
    THIRD_QUARTILE: "#26a641",
    FOURTH_QUARTILE: "#39d353",
  };

  return (
    colors[level] ||
    "#161b22"
  );
}


// ============================================================
// LEGEND
// ============================================================

function legendBox(
  x,
  y,
  color
) {
  return `
    <rect
      x="${x}"
      y="${y}"
      width="10"
      height="10"
      rx="2"
      fill="${color}"
    />
  `;
}


// ============================================================
// XML ESCAPE
// ============================================================

function escapeXML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}


main().catch(error => {
  console.error(error);
  process.exit(1);
});
