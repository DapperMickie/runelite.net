import React from 'react'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'
import {Bar, Line} from 'react-chartjs-2'
import Layout from '../components/layout'
import hero from '../_data/hero'
import {Col, ListGroup, ListGroupItem, Row} from 'reactstrap'
import * as R from 'ramda'

const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1)
const numberWithCommas = (x) => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
const highlightChangeValue = (value) => value >= 0
  ? (<span style={{color: 'green'}}>+{numberWithCommas(value)}</span>)
  : (<span style={{color: 'red'}}>{numberWithCommas(value)}</span>)

const getRandomColor = () => {
  const letters = '0123456789ABCDEF'
  let color = '#'

  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }

  return color
}

const skills = {
  attack: getRandomColor(),
  construction: getRandomColor(),
  cooking: getRandomColor(),
  crafting: getRandomColor(),
  defence: getRandomColor(),
  farming: getRandomColor(),
  firemaking: getRandomColor(),
  fishing: getRandomColor(),
  fletching: getRandomColor(),
  herblore: getRandomColor(),
  hitpoints: getRandomColor(),
  hunter: getRandomColor(),
  magic: getRandomColor(),
  mining: getRandomColor(),
  prayer: getRandomColor(),
  ranged: getRandomColor(),
  runecraft: getRandomColor(),
  slayer: getRandomColor(),
  smithing: getRandomColor(),
  strength: getRandomColor(),
  thieving: getRandomColor(),
  woodcutting: getRandomColor()
}

const skillNames = Object.keys(skills)
const capitalizedSkills = Object.keys(skills).map(skill => capitalizeFirstLetter(skill))
const skillColors = Object.values(skills)

const calculateOverallXp = (xpEntry) => skillNames.map(skill => xpEntry[skill + '_xp'] || 0).reduce((a, b) => a + b, 0)

const calculateRanksAndExp = (collector) => (value, key) => {
  let curKey = key
  let isRank = true

  if (key.indexOf('_rank') !== -1) {
    curKey = key.replace('_rank', '')
    isRank = true
  } else if (key.indexOf('_xp') !== -1) {
    curKey = key.replace('_xp', '')
    isRank = false
  } else {
    return
  }

  const curObj = collector[curKey]

  if (isRank) {
    collector[curKey] = curObj ? {
      ...curObj,
      rank: value - curObj.rank
    } : {
      xp: 0,
      rank: value
    }
  } else {
    collector[curKey] = curObj ? {
      ...curObj,
      xp: value - curObj.xp
    } : {
      xp: value,
      rank: 0
    }
  }
}

const Xp = ({ children, xpRange: { name, start, end, xp } }) => {
  const correctedXp = xp.map(xpEntry => ({
    ...xpEntry,
    overall_xp: calculateOverallXp(xpEntry)
  }))

  const labels = correctedXp.map(xpEntry => xpEntry.date.toDateString())

  const overallData = {
    labels: labels,
    datasets: [
      {
        label: 'Overall rank',
        backgroundColor: 'yellow',
        fill: false,
        data: correctedXp.map(xpEntry => xpEntry.overall_rank)
      }
    ]
  }

  const overallXp = {
    labels: labels,
    datasets: [{
      label: 'Total XP',
      backgroundColor: 'green',
      fill: false,
      data: correctedXp.map(xpEntry => xpEntry.overall_xp)
    }]
  }

  const startEntry = correctedXp[0]
  const endEntry = correctedXp[correctedXp.length - 1]
  const collector = {}
  R.forEachObjIndexed(calculateRanksAndExp(collector), startEntry)
  R.forEachObjIndexed(calculateRanksAndExp(collector), endEntry)

  const ranks = []
  R.forEachObjIndexed((value, key) => ranks.push({ ...value, img: key }), collector)
  ranks.sort((a, b) => {
    if (b.img === 'overall') return 1
    if (a.img < b.img) return -1
    if (a.img > b.img) return 1
    return 0
  })

  const allXp = {
    labels: capitalizedSkills,
    datasets: [{
      label: 'Experience gained',
      backgroundColor: skillColors,
      data: skillNames.map(skill => collector[skill] ? collector[skill].xp : 0)
    }]
  }

  const allRanks = {
    labels: capitalizedSkills,
    datasets: [{
      label: 'Ranks gained',
      backgroundColor: skillColors,
      data: skillNames.map(skill => collector[skill] ? collector[skill].rank : 0)
    }]
  }

  return (
    <div style={{height: 'inherit'}}>
      <Layout fullWidth>
        <Helmet>
          <title>Experience Tracker - {hero.title}</title>
        </Helmet>
        <h1>{name}</h1>
        <p className='text-muted'>{start ? start.toDateString() : ''} - {end ? end.toDateString() : ''}</p>
        <hr />
        <Row>
          <Col md='3' sm='4' xs='5'>
            <ListGroup>
              {ranks.map(({img, rank, xp}) => (
                <ListGroupItem key={img}>
                  <img alt={img} src={`/img/skillicons/${img}.png`} /> {capitalizeFirstLetter(img)}<br />
                  {highlightChangeValue(-rank)} ranks, {highlightChangeValue(xp)} xp
                </ListGroupItem>
              ))}
            </ListGroup>
          </Col>
          <Col md='9' sm='8' xs='7'>
            <Line data={overallData} options={{
              scales: {
                yAxes: [{
                  ticks: {
                    reverse: true
                  }
                }]
              }
            }} />
            <Line data={overallXp} />
            <Bar data={allXp} />
            <Bar data={allRanks} />
          </Col>
        </Row>
        {children}
      </Layout>
    </div>
  )
}

export default connect(
  (state) => ({
    xpRange: state.runelite
  })
)(Xp)
