import { useEffect, useState } from 'react'
import axios from 'axios'
import Moment from 'moment'
import { EyeOutlined } from '@ant-design/icons'
import { Table, Button, Modal, Form, Input, Tag } from 'antd'
import styled from 'styled-components'
import { formatDate, bufferToURI } from '../.././Utils/format'

function AdminPage() {
  const [requestKYC, setRequestKYC] = useState([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [filteredRequestKYC, setFilteredRequestKYC] = useState([])
  const [requestModal, setRequestModal] = useState({})

  useEffect(() => {
    fetchRequestKYC()
  }, [])

  const fetchRequestKYC = async () => {
    const res = await axios.get(
      'http://localhost:5000/api/v1/education?status=pending'
    )
    const filteredRequest = res.data.education.map(education => {
      return {
        ...education,
        createdAt: formatDate(new Date(education.createdAt)),
        key: education._id,
      }
    })
    setFilteredRequestKYC(filteredRequest)
    setRequestKYC(res.data.education)
  }
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Tax Code',
      dataIndex: 'legalRepresentative',
      key: 'legalRepresentative',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    // {
    //   title: 'Status',
    //   dataIndex: 'status',
    //   key: 'status',
    //   render: (_, { status }) => {
    //     let color = 'green'
    //     if (status === 'Deny') {
    //       color = 'volcano'
    //       return <Tag color={color}>Deny</Tag>
    //     }
    //     return <Tag color={color}>Accept</Tag>
    //   },
    // },
    {
      title: 'Preview',
      key: 'preview',
      dataIndex: 'preview',
      render: () => (
        <Button
          type="primary"
          onClick={showModal}
          icon={<EyeOutlined />}
          className="mr-3"
        ></Button>
      ),
    },
  ]

  const showModal = e => {
    const id = e.currentTarget.parentElement.parentElement.dataset.rowKey
    const request = requestKYC.find(req => req._id === id)
    setRequestModal(request)
    setIsModalVisible(true)
  }

  const handleOk = () => {
    setIsModalVisible(false)
  }

  const handleCancel = () => {
    setIsModalVisible(false)
  }

  const approveRequest = async id => {}

  const rejectRequest = async id => {
    console.log(id)
    const res = await axios.patch(
      `http://localhost:5000/api/v1/education/${id}`,
      {
        status: 'rejected',
      }
    )
    console.log(res)
    fetchRequestKYC()
    if (res.status === 200) {
      console.log('success')
    } else {
      console.log('error')
    }
    setIsModalVisible(false)
  }

  return (
    <div>
      <h1>Admin Page</h1>
      {/* {requestKYC.map(education => {
          const { address, image, legalRepresentative, name, _id, createdAt } =
            education
          const formatDate = Moment(new Date(createdAt)).format(
            'DD-MM-YYYY HH:mm:ss'
          )
          return (
            <li key={_id}>
              <h3>{name}</h3>
              <img
                src={`data:image/${image.contentType};base64,${Buffer.from(
                  image.data
                ).toString('base64')}`}
                alt=""
                width="200"
                height="300"
              />
              <p>{address}</p>
              <p>{legalRepresentative}</p>
              <p>{formatDate}</p>
              <button onClick={() => approveRequest(education)}>Approve</button>
              <button onClick={() => rejectRequest(education)}>Reject</button>
            </li>
          )
        })} */}
      <Table columns={columns} dataSource={filteredRequestKYC} />

      <Modal
        title="Minted NFT"
        visible={isModalVisible}
        onOk={approveRequest}
        onCancel={handleCancel}
        width={800}
        footer={[
          <Button key="back" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button
            key="reject"
            type="danger"
            onClick={() => rejectRequest(requestModal._id)}
          >
            Reject education
          </Button>,
          <Button
            key="approve"
            type="primary"
            onClick={() => approveRequest(requestModal._id)}
          >
            Approve education
          </Button>,
        ]}
      >
        <div className="d-flex justify-content-between">
          <Form
            encType="multipart/form-data"
            style={{ maxWidth: '60vw', margin: '0px auto' }}
            labelCol={{ span: 12 }}
            wrapperCol={{ span: 20 }}
            disabled
          >
            <Form.Item label="Center name" name="name">
              <Input type="text" id="name" placeholder={requestModal?.name} />
            </Form.Item>

            <Form.Item label="Address" name="address">
              <Input
                type="text"
                id="address"
                placeholder={requestModal?.address}
              />
            </Form.Item>

            <Form.Item label="Legal Representative" name="taxCode">
              <Input placeholder={requestModal?.legalRepresentative} />
            </Form.Item>

            <Form.Item label="Principal" name="principal">
              <Input placeholder={requestModal?.principal} />
            </Form.Item>

            <Form.Item label="Created At" name="createdAt">
              <Input
                placeholder={formatDate(new Date(requestModal?.createdAt))}
              />
            </Form.Item>
          </Form>
          <Container className="wrap_img">
            {requestModal?.image && ( // render image if exist, replace false by uri
              <img
                src={bufferToURI(requestModal.image)}
                alt="preview image"
                srcSet=""
              />
            )}
          </Container>
        </div>
      </Modal>
    </div>
  )
}

export default AdminPage

const Container = styled.div`
  width: 350px;
  height: 350px;
  border-radius: 8px;
  border: 1px dashed #ccc;
  overflow: hidden;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`
